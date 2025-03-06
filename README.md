# Crypto Trading Bot

## Overview
This project simulates a cryptocurrency trading bot that leverages three different machine learning algorithms—Multiple Linear Regression, XGBoost, and LightGBM—to make trade decisions based on market data. The bot executes simulated trades exclusively on the BNB/USDT trading pair. The application now includes refined auto-trading logic with FastAPI endpoints, a persistent order book, and a comprehensive React web interface.

## Features
- **Machine Learning Models**: Implements Multiple Linear Regression, XGBoost, and LightGBM trained on 20-candle historical data (120 features) to predict future prices.
- **React Web App**: Built with ShadCN and Tailwind CSS, featuring a live TradingView chart, model selection, leverage settings, and trade duration controls.
- **Live Simulated Trades**: Real-time auto-trading functionality that:
  - Deducts the trade amount from the balance when a trade starts.
  - Rolls over trades if a candle ends before the simulation duration.
  - Provides a Stop Trading button to immediately close all open trades.
- **Order Book Integration**: Displays a log of trades (newest on top) with details such as leverage, entry price, amount, position (with open orders in green), and final profit/loss (P/L) when closed.
- **FastAPI Endpoints**: Exposes predictions via FastAPI, enabling fast and reliable integration between your ML models and the React frontend.
- **Persistent State**: Balance, order history, and active trade status persist across page reloads via localStorage.

## Dataset
- **Source Data**: Initially, historical data was taken from [this Kaggle dataset](https://www.kaggle.com/datasets/franoisgeorgesjulien/crypto?select=Binance_BNBUSDT_1h+%281%29.csv).
- **Expansion**: The dataset was expanded using live data from Binance via `python-binance` and enriched with an additional two years of data.
- **Feature Engineering**: The dataset was transformed to include the past 20 candles as features (6 features each, totaling 120 inputs) to predict the current candle's closing price.

## Project Structure
```
CRYPTOTRADINGBOT/
│── data/                 # Contains the dataset and expanded historical data
│── models/               # Trained models stored in .pkl format (trained on 120 features)
│── public/               # Static assets for the web app
│── scripts/              # Training scripts, comparison scripts, and data expander scripts
│── src/                  # React frontend source code
│   ├── assets/           # Images and other assets
│   ├── components/ui/    # UI components (buttons, inputs, scroll areas, etc.)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility functions and API calls
│   ├── App.tsx           # Main app component
│   ├── CandleChart.tsx   # Trading chart component
│   ├── ModelCard.tsx     # Model selection and trade controls component
│   ├── Stats.tsx         # (Deprecated) Stats display component; replaced by NavbarStats
│   ├── NavbarStats.tsx   # Top navbar displaying user profile, P/L, and balance
│   ├── OrderBook.tsx     # Order book component showing trade logs
│   ├── main.tsx          # React app entry point
│── visuals/              # Visualizations generated from training and model evaluations
│── README.md             # Project documentation (this file)
│── package.json          # React app dependencies
│── vite.config.ts        # Vite configuration
```

## Installation & Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/imustitanveer/crypto-trading-bot.git
   cd crypto-trading-bot
   ```
2. **Install dependencies:**
   - **Backend:**  
     ```sh
     pip install -r requirements.txt
     ```
   - **Frontend:**  
     Navigate to the `src/` folder and run:
     ```sh
     npm install
     ```
3. **Run the Application:**
   - **Start the FastAPI backend:**
     ```sh
     uvicorn main:app --reload
     ```
   - **Run the React web app:**
     ```sh
     cd src
     npm run dev
     ```

## Usage
- **Training & Evaluation:**  
  Use the scripts in the `scripts/` folder to train your models on the enriched dataset (using the past 20 candles as features). Visualizations of model performance are available in the `visuals/` folder.
- **Auto-Trading Simulation:**  
  - **ModelCard:** Select your ML model, set leverage, enter a trade amount (or click "Max" to use the full balance), and specify the trade duration (in hours).  
  - **Order Book:** Monitor live trade orders, which are logged with details such as leverage, entry price, trade amount, and P/L.
  - **Stop Trading:** Use the "Stop Trading" button to immediately finalize all open orders.  
  - **NavbarStats:** A top navigation bar displays your profile, live P/L, and current balance—persisting even on page reloads.

## Future Enhancements
- **Dockerization of FastAPI:** Containerize the FastAPI backend for easy deployment.
- **Live Demo Setup:** Deploy the web app for a live demo, allowing real-time interaction with the trading bot.
- **Additional Improvements:**  
  - Integration with additional technical indicators and multi-asset support.
  - Enhanced order management and trade analytics.

## License
This project is open-source under the MIT License.