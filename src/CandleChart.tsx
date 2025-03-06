import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";

// Define type for candle data
type CandleData = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

const fetchLatestCandle = async (): Promise<CandleData | null> => {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=1"
    );
    const data = await response.json();
    if (data.length === 0) return null;
    const candle = data[0];
    return {
      time: (candle[0] / 1000) as Time,
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
    };
  } catch (error) {
    console.error("Error fetching latest candle:", error);
    return null;
  }
};

const fetchInitialCandlestickData = async (): Promise<CandleData[]> => {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=5000"
    );
    const data = await response.json();
    return data.map((candle: any) => ({
      time: (candle[0] / 1000) as Time,
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
    }));
  } catch (error) {
    console.error("Error fetching initial candlestick data:", error);
    return [];
  }
};

const CandleChart = ({ symbol = "BNBUSDT" }: { symbol?: string }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const initialWidth = container.clientWidth;
    const initialHeight = container.clientHeight;

    // Create the chart with initial dimensions
    const chart = createChart(container, {
      width: initialWidth,
      height: initialHeight,
      layout: { background: { color: "#0F172B" }, textColor: "#FFF" },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" },
      },
      timeScale: { timeVisible: true, borderColor: "#2B2B43", barSpacing: 10 },
    });
    chartRef.current = chart;
    const candleSeries = chart.addCandlestickSeries();
    seriesRef.current = candleSeries;

    // Load initial data
    const initializeChart = async () => {
      const data = await fetchInitialCandlestickData();
      seriesRef.current?.setData(data);
    };
    initializeChart();

    // Create and append tooltip element
    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.background = "rgba(0, 0, 0, 0.8)";
    tooltip.style.color = "white";
    tooltip.style.padding = "5px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.display = "none";
    tooltip.style.zIndex = "9999";
    tooltipRef.current = tooltip;
    container.appendChild(tooltip);

    // Subscribe to crosshair move event for tooltip positioning
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.point || !tooltipRef.current) {
        tooltipRef.current.style.display = "none";
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (!data) {
        tooltipRef.current.style.display = "none";
        return;
      }
      tooltipRef.current.innerHTML = `
        <strong>Open:</strong> ${data.open.toFixed(2)} 
        <strong>High:</strong> ${data.high.toFixed(2)} 
        <strong>Low:</strong> ${data.low.toFixed(2)} 
        <strong>Close:</strong> ${data.close.toFixed(2)}
      `;

      tooltipRef.current.style.display = "block";
      const tooltipWidth = tooltipRef.current.clientWidth;
      const tooltipHeight = tooltipRef.current.clientHeight;
      const offsetX = 10;
      const offsetY = 10;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      let left = param.point.x + offsetX;
      let top = param.point.y - tooltipHeight - offsetY;

      // Clamp horizontally within the container
      if (left + tooltipWidth > containerWidth) {
        left = containerWidth - tooltipWidth - 5;
      }
      if (left < 5) {
        left = 5;
      }
      // Clamp vertically within the container
      if (top < 5) {
        top = 5;
      }
      if (top + tooltipHeight > containerHeight) {
        top = containerHeight - tooltipHeight - 5;
      }

      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
    });

    // Live update: fetch new data every second
    const updateInterval = setInterval(async () => {
      const latestCandle = await fetchLatestCandle();
      if (latestCandle && seriesRef.current) {
        seriesRef.current.update(latestCandle);
      }
    }, 1000);

    // Add a ResizeObserver to update chart dimensions on container resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        chart.resize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    return () => {
      clearInterval(updateInterval);
      resizeObserver.disconnect();
      chart.remove();
      tooltipRef.current?.remove();
    };
  }, [symbol]);

  return (
    <div
      ref={chartContainerRef}
      className="p-2 bg-slate-900 rounded-xl md:rounded-2xl relative h-100 lg:h-153 overflow-hidden shadow-2xl"
    />
  );
};

export default CandleChart;