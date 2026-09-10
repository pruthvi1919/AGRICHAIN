import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

# ==============================
# Load dataset
# ==============================
df = pd.read_csv("data/Agriculture_price_filtered.csv")
print("Dataset loaded:", df.shape)

# ==============================
# Select required columns
# ==============================
df = df[
    ["STATE", "Commodity", "month", "year", "Modal_Price"]
].dropna()

# ==============================
# Encode categorical columns
# ==============================
state_encoder = LabelEncoder()
commodity_encoder = LabelEncoder()

df["state_enc"] = state_encoder.fit_transform(df["STATE"])
df["commodity_enc"] = commodity_encoder.fit_transform(df["Commodity"])

# ==============================
# Features & target
# ==============================
X = df[["state_enc", "commodity_enc", "month", "year"]]
y = df["Modal_Price"]

# ==============================
# Train-test split
# ==============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ==============================
# Train Random Forest model
# ==============================
model = RandomForestRegressor(
    n_estimators=150,
    max_depth=20,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ==============================
# Evaluate model
# ==============================
y_pred = model.predict(X_test)
print("MAE:", mean_absolute_error(y_test, y_pred))
print("R2 Score:", r2_score(y_test, y_pred))

# ==============================
# Save model & encoders
# ==============================
joblib.dump(model, "model.pkl")
joblib.dump(state_encoder, "state_encoder.pkl")
joblib.dump(commodity_encoder, "commodity_encoder.pkl")

print("Model training complete & saved!")



