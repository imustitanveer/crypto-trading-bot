import { useState, useEffect, useRef } from "react";

type TradeDetails = {
  entryPrice: number;
  position: "long" | "short";
  entryCandleOpen: number;
  leverage: number;
  tradeAmount: number;
  tradeStartTime: number;
  durationHours: number;
};

export function useAutoTrade() {
  const [balance, setBalance] = useState(1000);
  const [pnl, setPnl] = useState(0);
  const [tradeActive, setTradeActive] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null);
  const intervalRef = useRef<number | null>(null);

  // For simulation, we'll use real hours (3600000 ms = 1 hour)
  const SIMULATION_HOUR_MS = 3600000;

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

  // Fetch prediction from FastAPI; expects a features array of 120 values.
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
  // Use candles 0-19 (20 candles) as features; candle 20 provides the current price and time.
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
      // Build features from the first 20 candles:
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
      const entryPrice = Number(entryCandle[4]); // Using Close as the current price
      const openTime = Number(entryCandle[0]);

      const prediction = await fetchPrediction(model, features);
      if (prediction === null) return;
      const position = prediction > entryPrice ? "long" : "short";
      const tradeStartTime = Date.now();
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

  // Update P/L every second; if a new candle starts but simulation time remains,
  // finalize the current trade and immediately roll over into a new trade.
  useEffect(() => {
    if (tradeActive && tradeDetails) {
      intervalRef.current = window.setInterval(async () => {
        const currentCandleData = await fetchCandleData();
        if (!currentCandleData || !tradeDetails) return;
        const { currentPrice, openTime: currentOpen } = currentCandleData;
        const elapsed = Date.now() - tradeDetails.tradeStartTime;
        const durationMs = tradeDetails.durationHours * SIMULATION_HOUR_MS;

        if (currentOpen === tradeDetails.entryCandleOpen && elapsed < durationMs) {
          // Still within the same candle & time remains: update live (unrealized) P/L.
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
          // New candle started but simulation time is not up:
          // Finalize current trade for the ended candle.
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
          // Update balance with finalized P/L.
          setBalance((prev) => prev + finalPnl);
          // Optionally, you might want to accumulate P/L from previous trades.
          // Reset P/L display for the new trade.
          setPnl(0);
          // Compute remaining duration.
          const remainingMs = durationMs - elapsed;
          // Roll over: start new trade with new candle as entry.
          setTradeDetails({
            ...tradeDetails,
            entryPrice: currentPrice, // new entry price from current candle's close
            entryCandleOpen: currentOpen, // new candle open time
            tradeStartTime: Date.now(), // reset trade start time
            durationHours: remainingMs / SIMULATION_HOUR_MS, // update duration
          });
        } else {
          // Duration has expired: finalize trade.
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

  return { balance, pnl, tradeActive, startTrade };
}