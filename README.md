# Crypto Trading Bot

## Overview
This project simulates a cryptocurrency trading bot that leverages three different machine learning algorithms: Multiple Linear Regression, XGBoost, and LightGBM. The bot is designed to make trade decisions based on market data and executes simulated trades exclusively on the BNB/USDT trading pair.

## Features
- **Machine Learning Models**: Implements Multiple Linear Regression, XGBoost, and LightGBM.
- **React Web App**: Built using ShadCN and Tailwind CSS.
- **Live Trading View**: Displays real-time price data.
- **Leverage & Model Selection**: Users can set leverage and choose the ML model for predictions.
- **Live Simulated Trades**: Tracks balance and profit/loss during the auto-trading session.
- **Future Enhancements**:
  - APIs for trained ML models.
  - Order book integration in the web app.
  - Improved dataset with more historical data.

## Dataset
- Initially, historical data was taken from [this Kaggle dataset](https://www.kaggle.com/datasets/franoisgeorgesjulien/crypto?select=Binance_BNBUSDT_1h+%281%29.csv).
- The dataset was expanded using live data from Binance via `python-binance`.
- An additional two years of historical data was added to improve model performance.

## Project Structure
```
CRYPTOTRADINGBOT/
│── data/                 # Contains dataset and expanded historical data
│── models/               # Trained models stored in .pkl format
│── public/               # Static assets for the web app
│── scripts/              # Training scripts for all 3 models, comparison script, data expander script
│── src/                  # React frontend source code
│   ├── assets/           # Image and other assets
│   ├── components/ui/    # UI components like buttons, inputs, sidebar
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility functions and API calls
│   ├── App.tsx           # Main app component
│   ├── CandleChart.tsx   # Trading chart component
│   ├── ModelCard.tsx     # Model selection component
│   ├── Stats.tsx         # Stats display component
│   ├── main.tsx          # Entry point for React
│── visuals/              # Visualizations generated from training and model evaluations
│── README.md             # Project documentation
│── package.json          # Dependencies for the React app
│── vite.config.ts        # Configuration for Vite
```

## Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/imustitanveer/crypto-trading-bot.git
   cd crypto-trading-bot
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
   *(For the frontend, navigate to `src/` and run `npm install`)*
3. Run the web app:
   ```sh
   cd src
   npm run dev
   ```

## Usage
- Train models using scripts in `scripts/`.
- Start the simulation and analyze performance using visualizations in `visuals/`.
- Monitor trades in the React web app.

## License
This project is open-source under the MIT License.