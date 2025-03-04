from binance.client import Client
import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# Initialize the Binance Client
client = Client()  

# Fetch Live Data from Binance (last 12 hours of 1h klines)
klines = client.get_historical_klines("BNBUSDT", Client.KLINE_INTERVAL_1HOUR, "12 hours ago UTC")

# Process the fetched klines into a DataFrame
data = []
for k in klines:
    row = {
        'Date': datetime.fromtimestamp(k[0] / 1000),  # k[0] is the open time in ms
        'Symbol': "BNBUSDT",
        'Open': float(k[1]),
        'High': float(k[2]),
        'Low': float(k[3]),
        'Close': float(k[4]),
        'Volume BNB': float(k[5]),
        'Volume USDT': float(k[7]),      # k[7] is the quote asset volume
        'tradecount': int(k[8])          # k[8] is the number of trades
    }
    data.append(row)

df_live = pd.DataFrame(data)
print("Live Data:")
print(df_live)

# Prepare features and target
features = ['Open', 'High', 'Low', 'Volume BNB', 'Volume USDT', 'tradecount']
X_live = df_live[features]
y_actual = df_live['Close']

# Load the three saved models
with open('models/bnb_regression_model.pkl', 'rb') as f:
    model_lr = pickle.load(f)
with open('models/bnb_xgboost_model.pkl', 'rb') as f:
    model_xgb = pickle.load(f)
with open('models/bnb_lightgbm_model.pkl', 'rb') as f:
    model_lgb = pickle.load(f)

# Dictionary to store models for easy iteration
models = {
    "Linear Regression": model_lr,
    "XGBoost": model_xgb,
    "LightGBM": model_lgb
}

# Dictionary to store predictions and metrics for each model
predictions = {}
metrics = {}

for name, model in models.items():
    y_pred = model.predict(X_live)
    predictions[name] = y_pred
    mse = mean_squared_error(y_actual, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_actual, y_pred)
    metrics[name] = {"MSE": mse, "RMSE": rmse, "R2": r2}
    print(f"\n{name} Metrics:")
    print(f"MSE: {mse:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R^2 Score: {r2:.4f}")

# Visualize Actual vs. Predicted Close Prices for all models
plt.figure(figsize=(12, 8))
plt.plot(df_live['Date'], y_actual, label="Actual Close", marker='o', linestyle='-', color='black')

# Plot predictions from each model
for name, y_pred in predictions.items():
    plt.plot(df_live['Date'], y_pred, label=f"{name} Prediction", marker='o', linestyle='--')

plt.xlabel("Time")
plt.ylabel("Close Price")
plt.title("BNBUSDT Actual vs Predicted Close Prices (Live Data)")
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()