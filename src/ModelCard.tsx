import { useState } from 'react'
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function ModelCard() {
    const [count, setCount] = useState(0)

    return (
      <>
        <div className='bg-white/30 backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-center gap-4 md:p-8 md:order-1 mt-4 md:mt-0'>
        <div className='flex items-start justify-center w-full'>
            <h1 className='text-xl md:text-4xl font-bold text-white'>Auto Trade</h1>
        </div>
        
        <h1 className='text-sm md:text-lg font-semibold text-white'>Choose a Model</h1>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bnbregression">BNB Regression</SelectItem>
              <SelectItem value="bnblightgbm">BNB LightGBM</SelectItem>
              <SelectItem value="bnbxgboost">BNB XGBoost</SelectItem>
            </SelectContent>
  
          {/* Leverage Slider */}  
        <h1 className='text-sm md:text-lg font-semibold text-white'>Set Leverage</h1>
        </Select>
        <Slider defaultValue={[0]} max={50} step={10} />
        <h1 className='text-sm md:text-lg font-semibold text-white'>Select Hours</h1>

        <div className='flex flex-row gap-2 w-full'>
        <Input type="number" placeholder="Hours"/>
        <Button variant="default">Start Trading</Button>
        </div>
        </div>
      </>
    )
  }
  
  export default ModelCard