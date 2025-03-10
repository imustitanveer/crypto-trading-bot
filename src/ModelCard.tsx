import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAutoTradeContext } from "./AutoTradeContext";

function ModelCard() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [leverage, setLeverage] = useState(1);
  const [tradeAmount, setTradeAmount] = useState<string>(""); // store as string; default empty
  const [tradeDuration, setTradeDuration] = useState(1); // Duration in hours
  const { startTrade, stopTrade, tradeActive, balance } = useAutoTradeContext();

  // Set trade amount to maximum available balance.
  const handleSetMaxTrade = () => {
    setTradeAmount(balance.toString());
  };

  const handleStartTrading = async () => {
    if (!selectedModel) {
      alert("Please select a model first!");
      return;
    }
    const amount = Number(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Trade amount must be greater than 0!");
      return;
    }
    if (amount > balance) {
      alert("Trade amount cannot exceed your current balance!");
      return;
    }
    await startTrade(selectedModel, leverage, amount, tradeDuration);
  };

  return (
    <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-4 flex flex-col gap-4 md:p-8 mt-4 shadow-2xl">
      <div className="flex items-center justify-center">
        <h1 className="text-lg md:text-xl font-bold light:text-zinc-900 dark:text-white">
          Auto Trade
        </h1>
      </div>
      <h1 className="text-xs md:text-md font-semibold light:text-zinc-900 dark:text-white">
        Choose a Model
      </h1>
      <Select onValueChange={setSelectedModel} disabled={tradeActive}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bnb_regression_model">
            BNB Regression
          </SelectItem>
          <SelectItem value="bnb_lightgbm_model">
            BNB LightGBM
          </SelectItem>
          <SelectItem value="bnb_xgboost_model">
            BNB XGBoost
          </SelectItem>
        </SelectContent>
      </Select>

      <h1 className="text-xs md:text-md font-semibold light:text-zinc-900 dark:text-white">
        Set Leverage
      </h1>
      <Slider
        defaultValue={[1]}
        max={50}
        step={10}
        onValueChange={(val) => setLeverage(val[0])}
        disabled={tradeActive}
      />

      <div className="flex flex-row gap-2 items-center">
        <h1 className="text-xs md:text-md font-semibold light:text-zinc-900 dark:text-white w-2/3">
          Trade Amount ($)
        </h1>
        <div className="w-1/3 flex justify-end">
          <Button
            variant="outline"
            size={"sm"}
            onClick={handleSetMaxTrade}
            disabled={tradeActive}
          >
            Max
          </Button>
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <Input
          type="number"
          placeholder="Trade Amount"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          disabled={tradeActive}
        />
      </div>

      <h1 className="text-xs md:text-md font-semibold light:text-zinc-900 dark:text-white">
        Hours to Auto Trade
      </h1>
      <div className="flex flex-row gap-2 items-center">
        <Input
          type="number"
          placeholder="Duration (hours)"
          value={tradeDuration}
          onChange={(e) => setTradeDuration(Number(e.target.value))}
          className="w-2/3"
          disabled={tradeActive}
        />
        <div className="w-1/3">
          {tradeActive ? (
            <Button variant="default" onClick={stopTrade}>
              Stop Trading
            </Button>
          ) : (
            <Button variant="default" onClick={handleStartTrading}>
              Start Trading
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelCard;