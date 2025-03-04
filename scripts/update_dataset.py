import os
import pandas as pd
from binance.client import Client
from datetime import datetime, timedelta

# Configure Binance Client
client = Client()

# Load Existing Dataset
DATA_FILE = "data/Binance_BNBUSDT_1h.csv"
if not os.path.exists(DATA_FILE):
    raise FileNotFoundError(f"Could not find {DATA_FILE}. Make sure it exists.")

df = pd.read_csv(DATA_FILE, parse_dates=["Date"])  # Read CSV & parse 'Date' as datetime
df.sort_values("Date", inplace=True)
df.drop_duplicates(subset=["Date"], keep="last", inplace=True)

# Strip milliseconds before conversion
df["Date"] = df["Date"].astype(str).str.split('.').str[0]  # Remove milliseconds
df["Date"] = pd.to_datetime(df["Date"], format="%Y-%m-%d %H:%M:%S")  # Convert to datetime

# Get last date
last_date_in_dataset = df["Date"].iloc[-1]
print("Last date in current dataset:", last_date_in_dataset)

# Fetch New Data from Binance
start_time = last_date_in_dataset + timedelta(hours=1)
start_str = start_time.strftime("%d %b %Y %H:%M:%S")

print(f"Fetching new data from {start_str} to now...")

# Binance uses strings like "1 Dec 2022" or "1 Dec 2022 12:00:00" for historical klines
new_klines = client.get_historical_klines(
    "BNBUSDT",
    Client.KLINE_INTERVAL_1HOUR,
    start_str,         # start
    None               # end = current time
)

# Convert Fetched Klines to DataFrame and Append
if len(new_klines) == 0:
    print("No new klines found. Dataset is already up to date.")
else:
    # Convert klines into a DataFrame
    new_data = []
    for k in new_klines:
        row = {
            'Date': datetime.fromtimestamp(k[0] / 1000),
            'Symbol': "BNBUSDT",
            'Open': float(k[1]),
            'High': float(k[2]),
            'Low': float(k[3]),
            'Close': float(k[4]),
            'Volume BNB': float(k[5]),
            'Volume USDT': float(k[7]),  # quote asset volume
            'tradecount': int(k[8])
        }
        new_data.append(row)

    df_new = pd.DataFrame(new_data)
    df_new.sort_values("Date", inplace=True)

    # Append and remove duplicates
    df_updated = pd.concat([df, df_new], ignore_index=True)
    df_updated.drop_duplicates(subset=["Date"], keep="last", inplace=True)
    df_updated.sort_values("Date", inplace=True)
    df = df_updated  # rename back to df

    # Save updated CSV
    df.to_csv(DATA_FILE, index=False)
    print(f"Updated dataset saved to {DATA_FILE}")