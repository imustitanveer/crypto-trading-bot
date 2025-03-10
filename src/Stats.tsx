import { useAutoTradeContext } from "./AutoTradeContext";
import Profile from "./assets/profile.png";
import Logo from "./assets/logo.png"

function NavbarStats() {
  const { balance, pnl } = useAutoTradeContext();

  const pnlColor = pnl > 0 ? "text-green-500" : pnl < 0 ? "text-red-500" : "text-white";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/30 backdrop-blur-sm shadow-md px-4 py-2 grid grid-cols-3 sm:grid-cols-4 items-center gap-3">
      <div className="flex items-center">
        <img src={Logo} className="h-8 w-8" alt="Logo"></img>
        <h1 className="text-lg sm:text-2xl font-bold text-white">TradeBotX</h1>
      </div>
      {/* Left Section: Profile */}
      <div className="hidden sm:flex items-center gap-3">
        <img src={Profile} className="h-10 w-10 rounded-full" alt="Profile" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">Hugo Degen</span>
          <span className="text-xs font-semibold text-white">@hugodegen</span>
        </div>
      </div>
      {/* Center Section: P/L */}
      <div className="flex-1 flex justify-center items-center">
        <span className={`text-sm font-semibold ${pnlColor}`}>
          P/L: ${pnl.toFixed(2)}
        </span>
      </div>
      {/* Right Section: Balance */}
      <div className="flex items-center justify-end">
        <span className="text-sm bg-indigo-100 rounded-full px-3 py-1 font-bold text-indigo-700">
          ${balance.toFixed(2)}
        </span>
      </div>
    </header>
  );
}

export default NavbarStats;