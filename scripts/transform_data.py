import pandas as pd

# Load dataset
df = pd.read_csv("scripts/data/Binance_BNBUSDT_1h.csv")

# Number of past candles to use as features
LOOKBACK = 20  

# Create new dataframe with shifted features
features = []
for i in range(1, LOOKBACK + 1):  # Shift from 1 to 20
    df[f'Open_t-{i}'] = df['Open'].shift(i)
    df[f'High_t-{i}'] = df['High'].shift(i)
    df[f'Low_t-{i}'] = df['Low'].shift(i)
    df[f'Close_t-{i}'] = df['Close'].shift(i)
    df[f'Volume BNB_t-{i}'] = df['Volume BNB'].shift(i)
    df[f'Volume USDT_t-{i}'] = df['Volume USDT'].shift(i)
    df[f'tradecount_t-{i}'] = df['tradecount'].shift(i)

# Exclude High and Low for t-0 (the most recent candle)
df["Open_t"] = df["Open"]
df["Close_t"] = df["Close"]
df["Volume BNB_t"] = df["Volume BNB"]
df["Volume USDT_t"] = df["Volume USDT"]
df["tradecount_t"] = df["tradecount"]

# Drop rows with NaN values (first LOOKBACK rows will be NaN)
df = df.iloc[LOOKBACK:].reset_index(drop=True)

# Set target (Close price of the current candle)
df["Close_t"] = df["Close"]

# Save transformed dataset
df.to_csv("scripts/data/transformed_BNBUSDT_data.csv", index=False)

print("Dataset transformed and saved as 'transformed_BNBUSDT_data.csv'")