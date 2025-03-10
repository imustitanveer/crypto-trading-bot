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

  // Use ref only for interval
  const intervalRef = useRef<number | null>(null);

  // Stop-loss and take-profit percentages now in use
  const STOP_LOSS = -0.03;
  const TAKE_PROFIT = 0.08;

  const SIMULATION_HOUR_MS = 3600000; // 1 real hour

  // Persist state.
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

  // Fetch the latest 21 candles from Binance.
  const fetchCandleData = async () => {
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=21"
      );
      const data = await res.json();
      if (!data || data.length < 21) throw new Error("Not enough candle data");
      return data;
    } catch (error) {
      console.error("Error fetching candle data:", error);
      return null;
    }
  };

  const API_BASE_URL = "https://api.aibymusti.com";

  // Fetch prediction from FastAPI
  const fetchPrediction = async (model: string, features: number[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/predict/${model}`, {
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

  // Start a trade
  const startTrade = async (
    model: string,
    leverage: number,
    tradeAmount: number,
    durationHours: number
  ) => {
    try {
      const data = await fetchCandleData();
      if (!data) return;

      // Build features from the first 20 candles
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

      // Use the 21st candle as the entry candle
      const currentCandle = data[20];
      const entryPrice = Number(currentCandle[4]);
      const openTime = Number(currentCandle[0]);

      // Append current candle features
      features.push(Number(currentCandle[1])); // Open_t
      features.push(Number(currentCandle[5])); // Volume BNB_t
      features.push(Number(currentCandle[7])); // Volume USDT_t
      features.push(Number(currentCandle[8])); // tradecount_t

      // Predict
      const prediction = await fetchPrediction(model, features);
      if (prediction === null) return;
      const position = prediction > entryPrice ? "long" : "short";
      const tradeStartTime = Date.now();

      // Deduct the trade amount
      setBalance((prev) => prev - tradeAmount);

      // Create and store a new order
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
      setOrders((prev) => [newOrder, ...prev]);

      // Set trade details
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

  // Stop trade
  const stopTrade = async () => {
    if (!tradeActive || !tradeDetails) return;
    const candleData = await fetchCandleData();
    if (!candleData) return;

    // Get the current candle
    const currentCandle = candleData[candleData.length - 1];
    const currentPrice = Number(currentCandle[4]);
    let finalPnl = 0;
    let profitPercent = 0;
    if (tradeDetails.position === "long") {
      profitPercent =
        (currentPrice - tradeDetails.entryPrice) / tradeDetails.entryPrice;
      finalPnl =
        profitPercent * tradeDetails.tradeAmount * tradeDetails.leverage;
    } else {
      profitPercent =
        (tradeDetails.entryPrice - currentPrice) / tradeDetails.entryPrice;
      finalPnl =
        profitPercent * tradeDetails.tradeAmount * tradeDetails.leverage;
    }

    // Update orders
    setOrders((prev) =>
      prev.map((order) =>
        order.id === `${tradeDetails.tradeStartTime}`
          ? { ...order, pnl: finalPnl, status: "closed" }
          : order
      )
    );

    // Return the original wager plus P/L
    setBalance((prev) => prev + tradeDetails.tradeAmount + finalPnl);
    setPnl(finalPnl);
    setTradeActive(false);
    setTradeDetails(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Watch P/L, implement TP/SL
  useEffect(() => {
    if (tradeActive && tradeDetails) {
      intervalRef.current = window.setInterval(async () => {
        const candleData = await fetchCandleData();
        if (!candleData || !tradeDetails) return;
        const currentCandle = candleData[candleData.length - 1];
        const { currentPrice, openTime: currentOpen } = {
          currentPrice: Number(currentCandle[4]),
          openTime: Number(currentCandle[0]),
        };
        const elapsed = Date.now() - tradeDetails.tradeStartTime;
        const durationMs = tradeDetails.durationHours * SIMULATION_HOUR_MS;

        let profitPercent = 0;
        if (tradeDetails.position === "long") {
          profitPercent =
            (currentPrice - tradeDetails.entryPrice) / tradeDetails.entryPrice;
        } else {
          profitPercent =
            (tradeDetails.entryPrice - currentPrice) / tradeDetails.entryPrice;
        }

        // **Use STOP_LOSS and TAKE_PROFIT here**
        if (profitPercent <= STOP_LOSS || profitPercent >= TAKE_PROFIT) {
          await stopTrade();
          return;
        }

        if (currentOpen === tradeDetails.entryCandleOpen && elapsed < durationMs) {
          let currentPnl =
            profitPercent * tradeDetails.tradeAmount * tradeDetails.leverage;
          setPnl(currentPnl);
        } else if (elapsed < durationMs) {
          let finalPnl =
            profitPercent * tradeDetails.tradeAmount * tradeDetails.leverage;
          setOrders((prev) =>
            prev.map((order) =>
              order.id === `${tradeDetails.tradeStartTime}`
                ? { ...order, pnl: finalPnl, status: "closed" }
                : order
            )
          );
          setBalance((prev) => prev + finalPnl);
          setPnl(0);
          const remainingMs = durationMs - elapsed;
          const newTradeDetails = {
            ...tradeDetails,
            entryPrice: currentPrice,
            entryCandleOpen: Number(currentCandle[0]),
            tradeStartTime: Date.now(),
            durationHours: remainingMs / SIMULATION_HOUR_MS,
          };
          setTradeDetails(newTradeDetails);
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
          let finalPnl =
            profitPercent * tradeDetails.tradeAmount * tradeDetails.leverage;
          setOrders((prev) =>
            prev.map((order) =>
              order.id === `${tradeDetails.tradeStartTime}`
                ? { ...order, pnl: finalPnl, status: "closed" }
                : order
            )
          );
          setBalance((prev) => prev + tradeDetails.tradeAmount + finalPnl);
          setPnl(finalPnl);
          setTradeActive(false);
          setTradeDetails(null);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tradeActive, tradeDetails]);

  return { balance, pnl, tradeActive, orders, startTrade, stopTrade };
}

type AutoTradeContextType = ReturnType<typeof useAutoTrade>;
const AutoTradeContext = createContext<AutoTradeContextType | null>(null);

export const AutoTradeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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