import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np
import pickle
import matplotlib.pyplot as plt

df = pd.read_csv('data/Binance_BNBUSDT_1h.csv')

features = ['Open', 'High', 'Low', 'Volume BNB', 'Volume USDT', 'tradecount']
X = df[features]
y = df['Close']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Create and train the model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions on the test set
y_pred = model.predict(X_test)

# Evaluate the model
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)
print(f"Mean Squared Error (MSE): {mse:.4f}")
print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
print(f"R^2 Score: {r2:.4f}")

# Visualize actual vs. predicted values (plot a subset for clarity)
plt.figure(figsize=(10, 6))
plt.plot(range(len(y_test)), y_test.values, label='Actual', alpha=0.7)
plt.plot(range(len(y_pred)), y_pred, label='Predicted', alpha=0.7)
plt.title("BNB Close Price Prediction: Actual vs Predicted")
plt.xlabel("Sample Index (Test Set)")
plt.ylabel("Close Price")
plt.legend()
plt.show()

# Save the trained model
with open('bnb_regression_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model saved as 'bnb_regression_model.pkl'")