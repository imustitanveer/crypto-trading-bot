import { useState } from 'react'
import './App.css'
import CandleChart from './CandleChart.tsx'
import ModelCard from './ModelCard.tsx'
import Stats from './Stats.tsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className='lg:grid lg:grid-cols-[1fr_2fr] p-4 md:p-6 md:gap-4 md:order-1'>
    <div className="relative h-full w-full lg:order-2">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-center items-center h-10 bg-slate-900 rounded-2xl text-white font-bold z-10">
        BNB/USD
      </div>
      {/* Chart container with top padding to avoid overlap with the header */}
      < CandleChart />
    </div>

    <div className='flex flex-col gap-4'>
      < ModelCard />
      < Stats />
    </div>  
    </div>
    </>
  )
}

export default App