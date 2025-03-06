import { AutoTradeProvider } from "./AutoTradeContext";
import CandleChart from "./CandleChart";
import ModelCard from "./ModelCard";
import Stats from "./Stats";
import OrderBook from "./OrderBook";
import "./App.css";

function App() {
  return (
    <AutoTradeProvider>
      <Stats />
      <div className="lg:grid lg:grid-cols-[1fr_2fr] p-4 md:p-4 md:gap-4 mt-10">
        <div className="relative h-full w-full lg:order-2 mt-4">
          <div className="absolute top-0 left-0 right-0 flex justify-center items-center h-10 bg-slate-900 rounded-2xl text-gray-300 font-bold z-10">
            BNB/USD 1h
          </div>
          <CandleChart />
        </div>
        <div className="flex flex-col gap-4">
          <ModelCard />
          <OrderBook />
        </div>
      </div>
    </AutoTradeProvider>
  );
}

export default App;