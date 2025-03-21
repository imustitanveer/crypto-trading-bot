import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import xgboost 
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pickle

# 1. Load Data
df = pd.read_csv("scripts/data/transformed_BNBUSDT_data.csv", parse_dates=["Date"])
df.sort_values("Date", inplace=True)
df.drop_duplicates(subset=["Date"], keep="last", inplace=True)

# Define features: Last 20 candles (excluding High & Low for t-0)
LOOKBACK = 20
features = []

for i in range(1, LOOKBACK + 1):  # Use past 20 candles
    features.extend([
        f'Open_t-{i}', f'High_t-{i}', f'Low_t-{i}',
        f'Volume BNB_t-{i}', f'Volume USDT_t-{i}', f'tradecount_t-{i}'
    ])

# Also include the current candle's features **without High & Low**
features.extend([
    'Open_t', 'Volume BNB_t', 'Volume USDT_t', 'tradecount_t'
])

# Select input features (X) and target variable (y)
X = df[features]
y = df['Close_t']  # Predicting the current candle's close price

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 4. Train XGBoost Model
model_xgb = xgboost.XGBRegressor(objective='reg:squarederror', n_estimators=100, random_state=42)
model_xgb.fit(X_train, y_train)

# 5. Make Predictions
y_pred = model_xgb.predict(X_test)

# 6. Evaluate the Model
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)
print("XGBoost Results:")
print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"R2 Score: {r2:.4f}")

# 7. Plot Actual vs. Predicted
plt.figure(figsize=(10,6))
plt.plot(range(len(y_test)), y_test.values, label='Actual', marker='o')
plt.plot(range(len(y_pred)), y_pred, label='Predicted', marker='o')
plt.xlabel("Index")
plt.ylabel("Close Price")
plt.title("XGBoost: Actual vs Predicted Close Prices")
plt.legend()
plt.show()

# 8. Save the Model for API Use
with open("scripts/models/bnb_xgboost_model.pkl", "wb") as f:
    pickle.dump(model_xgb, f)
print("XGBoost model saved as 'bnb_xgboost_model.pkl'")