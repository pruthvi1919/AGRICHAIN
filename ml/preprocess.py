import pandas as pd
import os

# -----------------------------
# CONFIG
# -----------------------------
INPUT_FILE = "data/Agriculture_price_dataset.csv"
OUTPUT_FILE = "data/Agriculture_price_filtered.csv"

# States to keep (as per requirement)
SELECTED_STATES = [
    "Karnataka",
    "Maharashtra",
    "Kerala",
    "Punjab",
    "Delhi",
    "Tamil Nadu",
    "Andhra Pradesh",
    
    "Uttar Pradesh"
]

# -----------------------------
# LOAD DATA
# -----------------------------
print("📥 Loading dataset...")
df = pd.read_csv(INPUT_FILE)

print(f"Original dataset shape: {df.shape}")

# -----------------------------
# STANDARDIZE COLUMN NAMES
# -----------------------------
df.columns = df.columns.str.strip()


df["STATE"] = df["STATE"].str.strip().str.title()


# -----------------------------
# FILTER SELECTED STATES
# -----------------------------
print("🔎 Filtering selected states...")
df = df[df["STATE"].isin(SELECTED_STATES)]

# Convert Price Date to datetime
df["Price Date"] = pd.to_datetime(
    df["Price Date"],
    errors="coerce",
    dayfirst=True
)

# Drop rows where date is invalid
df = df.dropna(subset=["Price Date"])

# Extract month and year
df["month"] = df["Price Date"].dt.month
df["year"] = df["Price Date"].dt.year

print(f"After state filtering: {df.shape}")

# -----------------------------
# DROP UNUSED / NULL ROWS
# -----------------------------
print("🧹 Cleaning data...")

# Drop rows with missing essential values
df = df.dropna(subset=[
    "STATE",
    "District Name",
    "Market Name",
    "Commodity",
    "Min_Price",
    "Max_Price",
    "Modal_Price",
    "Price Date"
])

# Convert prices to numeric
df["Min_Price"] = pd.to_numeric(df["Min_Price"], errors="coerce")
df["Max_Price"] = pd.to_numeric(df["Max_Price"], errors="coerce")
df["Modal_Price"] = pd.to_numeric(df["Modal_Price"], errors="coerce")

df = df.dropna(subset=["Min_Price", "Max_Price", "Modal_Price"])

# -----------------------------
# FORMAT DATE
# -----------------------------
df["Price Date"] = pd.to_datetime(df["Price Date"], errors="coerce")
df = df.dropna(subset=["Price Date"])

# -----------------------------
# REMOVE INVALID PRICE ROWS
# -----------------------------
df = df[
    (df["Min_Price"] > 0) &
    (df["Max_Price"] > 0) &
    (df["Modal_Price"] > 0)
]

print(f"After cleaning: {df.shape}")

# -----------------------------
# SORT DATA
# -----------------------------
df = df.sort_values(by=["STATE", "Commodity", "Price Date"])

# -----------------------------
# SAVE FILTERED DATASET
# -----------------------------
os.makedirs("data", exist_ok=True)
df.to_csv(OUTPUT_FILE, index=False)

print("✅ Preprocessing complete!")
print(f"📁 Filtered dataset saved at: {OUTPUT_FILE}")
print(f"📊 Final dataset shape: {df.shape}")
