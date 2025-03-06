import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

export type Order = {
  id: string;
  leverage: number;
  entryPrice: number;
  tradeAmount: number;
  position: "long" | "short";
  pnl?: number;
  status: "open" | "closed";
  tradeStartTime: number;
  durationHours: number;
};

export function useAutoTrade() {
  // Load persisted balance and orders.
  const [balance, setBalance] = useState<number>(() => {
    const stored = localStorage.getItem("balance");
    return stored ? Number(stored) : 1000;
  });
  const [pnl, setPnl] = useState<number>(0);
  const [tradeActive, setTradeActive] = useState<boolean>(() => {
    const stored = localStorage.getItem("tradeActive");
    return stored ? JSON.parse(stored) : false;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem("orders");
    return stored ? JSON.parse(stored) : [];
  });
  const [tradeDetails, setTradeDetails] = useState<{
    entryPrice: number;
    position: "long" | "short";
    entryCandleOpen: number;
    leverage: number;
    tradeAmount: number;
    tradeStartTime: number;
    durationHours: number;
  } | null>(() => {
    const stored = localStorage.getItem("tradeDetails");
    return stored ? JSON.parse(stored) : null;
  });

  const intervalRef = useRef<number | null>(null);
  const SIMULATION_HOUR_MS = 3600000; // 1 real hour

  // Persist balance, orders, tradeActive, and tradeDetails.
  useEffect(() => {
    localStorage.setItem("balance", balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("tradeActive", JSON.stringify(tradeActive));
  }, [tradeActive]);

  useEffect(() => {
    localStorage.setItem("tradeDetails", JSON.stringify(tradeDetails));
  }, [tradeDetails]);

  // Fetch the latest 1h candle from Binance.
  const fetchCandleData = async () => {
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=1"
      );
      const data = await res.json();
      if (!data || data.length === 0) throw new Error("No candle data found");
      const lastCandle = data[0];
      const currentPrice = Number(lastCandle[4]); // Using Close as current price
      const openTime = Number(lastCandle[0]);
      return { currentPrice, openTime };
    } catch (error) {
      console.error("Error fetching candle data:", error);
      return null;
    }
  };

  // Fetch prediction from FastAPI; expects an array of 120 features.
  const fetchPrediction = async (model: string, features: number[]) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/predict/${model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });
      if (!res.ok) throw new Error("Prediction API failed");
      const data = await res.json();
      return data.prediction[0];
    } catch (error) {
      console.error("Error fetching prediction:", error);
      return null;
    }
  };

  // Start a trade using the last 21 candles:
  // Use candles 0-19 as features; candle 20 gives the entry price (Close) and open time.
  const startTrade = async (
    model: string,
    leverage: number,
    tradeAmount: number,
    durationHours: number
  ) => {
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=21"
      );
      const data = await res.json();
      if (!data || data.length < 21) {
        console.error("Not enough candle data");
        return;
      }
      // Build features from the first 20 candles.
      const features: number[] = [];
      for (let i = 0; i < 20; i++) {
        const k = data[i];
        features.push(Number(k[1])); // Open
        features.push(Number(k[2])); // High
        features.push(Number(k[3])); // Low
        features.push(Number(k[5])); // Volume BNB
        features.push(Number(k[7])); // Volume USDT
        features.push(Number(k[8])); // tradecount
      }
      // Use the 21st candle as the entry candle.
      const entryCandle = data[20];
      const entryPrice = Number(entryCandle[4]); // Using Close as current price
      const openTime = Number(entryCandle[0]);

      const prediction = await fetchPrediction(model, features);
      if (prediction === null) return;
      const position = prediction > entryPrice ? "long" : "short";
      const tradeStartTime = Date.now();

      // Immediately deduct trade amount from balance.
      setBalance((prev) => prev - tradeAmount);

      // Create a new order.
      const newOrder: Order = {
        id: `${tradeStartTime}`,
        leverage,
        entryPrice,
        tradeAmount,
        position,
        status: "open",
        tradeStartTime,
        durationHours,
      };
      // Add the new order at the beginning (newest on top).
      setOrders((prev) => [newOrder, ...prev]);

      // Set trade details.
      setTradeDetails({
        entryPrice,
        position,
        entryCandleOpen: openTime,
        leverage,
        tradeAmount,
        tradeStartTime,
        durationHours,
      });
      setTradeActive(true);
    } catch (error) {
      console.error("Error starting trade:", error);
    }
  };

  // Stop trading: finalize any open trade immediately.
  const stopTrade = async () => {
    if (!tradeActive || !tradeDetails) return;
    const currentCandleData = await fetchCandleData();
    if (!currentCandleData) return;
    const { currentPrice } = currentCandleData;
    let finalPnl = 0;
    if (tradeDetails.position === "long") {
      finalPnl =
        ((currentPrice - tradeDetails.entryPrice) / tradeDetails.entryPrice) *
        tradeDetails.tradeAmount *
        tradeDetails.leverage;
    } else {
      finalPnl =
        ((tradeDetails.entryPrice - currentPrice) / tradeDetails.entryPrice) *
        tradeDetails.tradeAmount *
        tradeDetails.leverage;
    }
    // Update the current order.
    setOrders((prev) =>
      prev.map((order) =>
        order.id === `${tradeDetails.tradeStartTime}`
          ? { ...order, pnl: finalPnl, status: "closed" }
          : order
      )
    );
    setPnl(finalPnl);
    setBalance((prev) => prev + tradeDetails.tradeAmount + finalPnl);
    setTradeActive(false);
    setTradeDetails(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Update P/L every second.
  // If a new candle starts but simulation time remains, finalize the current trade and roll over.
  useEffect(() => {
    if (tradeActive && tradeDetails) {
      intervalRef.current = window.setInterval(async () => {
        const currentCandleData = await fetchCandleData();
        if (!currentCandleData || !tradeDetails) return;
        const { currentPrice, openTime: currentOpen } = currentCandleData;
        const elapsed = Date.now() - tradeDetails.tradeStartTime;
        const durationMs = tradeDetails.durationHours * SIMULATION_HOUR_MS;

        if (currentOpen === tradeDetails.entryCandleOpen && elapsed < durationMs) {
          // Update live (unrealized) P/L.
          let currentPnl = 0;
          if (tradeDetails.position === "long") {
            currentPnl =
              ((currentPrice - tradeDetails.entryPrice) / tradeDetails.entryPrice) *
              tradeDetails.tradeAmount *
              tradeDetails.leverage;
          } else {
            currentPnl =
              ((tradeDetails.entryPrice - currentPrice) / tradeDetails.entryPrice) *
              tradeDetails.tradeAmount *
              tradeDetails.leverage;
          }
          setPnl(currentPnl);
        } else if (elapsed < durationMs) {
          // New candle started but simulation time remains.
          let finalPnl = 0;
          if (tradeDetails.position === "long") {
            finalPnl =
              ((currentPrice - tradeDetails.entryPrice) / tradeDetails.entryPrice) *
              tradeDetails.tradeAmount *
              tradeDetails.leverage;
          } else {
            finalPnl =
              ((tradeDetails.entryPrice - currentPrice) / tradeDetails.entryPrice) *
              tradeDetails.tradeAmount *
              tradeDetails.leverage;
          }
          // Finalize the current order.
          setOrders((prev) =>
            prev.map((order) =>
              order.id === `${tradeDetails.tradeStartTime}`
                ? { ...order, pnl: finalPnl, status: "closed" }
                : order
            )
          );
          // Update balance.
          setBalance((prev) => prev + finalPnl);
          // Reset P/L.
          setPnl(0);
          // Calculate remaining simulation time.
          const remainingMs = durationMs - elapsed;
          // Roll over: start a new trade with new candle as entry using remaining time.
          const newTradeDetails = {
            ...tradeDetails,
            entryPrice: currentPrice,
            entryCandleOpen: currentOpen,
            tradeStartTime: Date.now(),
            durationHours: remainingMs / SIMULATION_HOUR_MS,
          };
          setTradeDetails(newTradeDetails);
          // Also create a new order for the rollover.
          const newOrder: Order = {
            id: `${newTradeDetails.tradeStartTime}`,
            leverage: newTradeDetails.leverage,
            entryPrice: newTradeDetails.entryPrice,
            tradeAmount: newTradeDetails.tradeAmount,
            position: newTradeDetails.position,
            status: "open",
            tradeStartTime: newTradeDetails.tradeStartTime,
            durationHours: newTradeDetails.durationHours,
          };
          setOrders((prev) => [newOrder, ...prev]);
        } else {
          // Simulation duration expired: finalize trade.
          let finalPnl = 0;
          if (tradeDetails.position === "long") {
            finalPnl =
              ((currentPrice - tradeDetails.entryPrice) / tradeDetails.entryPrice) *
              tradeDetails.tradeAmount *
              tradeDetails.leverage;
          } else {
            finalPnl =
              ((tradeDetails.entryPrice - currentPrice) / tradeDetails.entryPrice) *
              tradeDetails.tradeAmount *
              tradeDetails.leverage;
          }
          setPnl(finalPnl);
          setOrders((prev) =>
            prev.map((order) =>
              order.id === `${tradeDetails.tradeStartTime}`
                ? { ...order, pnl: finalPnl, status: "closed" }
                : order
            )
          );
          setBalance((prev) => prev + finalPnl);
          setTradeActive(false);
          setTradeDetails(null);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tradeActive, tradeDetails]);

  return { balance, pnl, tradeActive, orders, startTrade, stopTrade };
}

type AutoTradeContextType = ReturnType<typeof useAutoTrade>;
const AutoTradeContext = createContext<AutoTradeContextType | null>(null);

export const AutoTradeProvider = ({ children }: { children: React.ReactNode }) => {
  const autoTrade = useAutoTrade();
  return (
    <AutoTradeContext.Provider value={autoTrade}>
      {children}
    </AutoTradeContext.Provider>
  );
};

export const useAutoTradeContext = (): AutoTradeContextType => {
  const context = useContext(AutoTradeContext);
  if (!context) {
    throw new Error("useAutoTradeContext must be used within an AutoTradeProvider");
  }
  return context;
};