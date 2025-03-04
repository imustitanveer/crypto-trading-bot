import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pickle

# 1. Load Data
df = pd.read_csv("data/Binance_BNBUSDT_1h.csv", parse_dates=["Date"])
df.sort_values("Date", inplace=True)
df.drop_duplicates(subset=["Date"], keep="last", inplace=True)

# 2. Select Features and Target
features = ['Open', 'High', 'Low', 'Volume BNB', 'Volume USDT', 'tradecount']
target = 'Close'
X = df[features]
y = df[target]

# 3. Split Data (70-30 split)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 4. Train LightGBM Model
model_lgb = lgb.LGBMRegressor(n_estimators=100, random_state=42)
model_lgb.fit(X_train, y_train)

# 5. Make Predictions
y_pred = model_lgb.predict(X_test)

# 6. Evaluate the Model
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)
print("LightGBM Results:")
print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
print(f"R2 Score: {r2:.4f}")

# 7. Plot Actual vs. Predicted
plt.figure(figsize=(10,6))
plt.plot(range(len(y_test)), y_test.values, label='Actual', marker='o')
plt.plot(range(len(y_pred)), y_pred, label='Predicted', marker='o')
plt.xlabel("Index")
plt.ylabel("Close Price")
plt.title("LightGBM: Actual vs Predicted Close Prices")
plt.legend()
plt.show()

# 8. Save the Model for API Use
with open("models/bnb_lightgbm_model.pkl", "wb") as f:
    pickle.dump(model_lgb, f)
print("LightGBM model saved as 'bnb_lightgbm_model.pkl'")