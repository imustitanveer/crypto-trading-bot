import { useState } from 'react'
import Profile from './assets/profile.png'

function Stats() {
    const [count, setCount] = useState(0)

    return (
      <>
        <div className='bg-white/30 backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-center gap-4 md:p-8 md:order-1 mt-4 md:mt-0'>
            <div className='flex flex-row gap-5 items-center justify-between'>
                <img src={Profile} className='h-32 w-32 rounded-full p-4' />
                <div className='flex flex-col'>
                    <h1 className='text-lg md:text-2xl font-bold text-white'>Hugo Degen</h1>
                    <h1 className='text-sm md:text-lg font-semibold text-white'>@hugodegen</h1>
                    <h1 className='text-sm md:text-lg font-semibold text-white'>P/L--</h1>
                </div>
                <h1 className='text-lg bg-indigo-100 rounded-full p-4 md:text-2xl font-bold text-indigo-700'>$1,000</h1>
            </div>
        </div>
      </>
    )
  }
  
  export default Stats