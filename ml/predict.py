import sys
import os
import joblib
import pandas as pd

# ------------------------------
# Resolve base directory (ml/)
# ------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
STATE_ENCODER_PATH = os.path.join(BASE_DIR, "state_encoder.pkl")
COMMODITY_ENCODER_PATH = os.path.join(BASE_DIR, "commodity_encoder.pkl")

# ------------------------------
# Read inputs from command line
# ------------------------------
# Expected args:
# state, commodity, month, year
try:
    state = sys.argv[1]
    commodity = sys.argv[2]
    month = int(sys.argv[3])
    year = int(sys.argv[4])
except:
    print("ERROR: Invalid arguments")
    sys.exit(1)

# ------------------------------
# Load model & encoders
# ------------------------------
try:
    model = joblib.load(MODEL_PATH)
    state_encoder = joblib.load(STATE_ENCODER_PATH)
    commodity_encoder = joblib.load(COMMODITY_ENCODER_PATH)
except FileNotFoundError as e:
    print(f"ERROR: Model file missing -> {e}")
    sys.exit(1)

# ------------------------------
# Encode inputs
# ------------------------------
try:
    state_enc = state_encoder.transform([state])[0]
except:
    print("ERROR: Unknown state")
    sys.exit(1)

try:
    commodity_enc = commodity_encoder.transform([commodity])[0]
except:
    print("ERROR: Unknown commodity")
    sys.exit(1)

# ------------------------------
# Prepare input dataframe
# ------------------------------
X = pd.DataFrame([{
    "state_enc": state_enc,
    "commodity_enc": commodity_enc,
    "month": month,
    "year": year
}])

# ------------------------------
# Predict
# ------------------------------
try:
    predicted_price = model.predict(X)[0]
    print(round(float(predicted_price), 2))  # IMPORTANT: print only number
except Exception as e:
    print(f"ERROR: Prediction failed -> {e}")
    sys.exit(1)
