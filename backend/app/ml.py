from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression

from .schemas import SUBCATEGORIES

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "SampleSuperstore.csv"
MODELS_DIR = BASE_DIR / "models"
DEMAND_MODEL_PATH = MODELS_DIR / "demand_model.pkl"
RISK_MODEL_PATH = MODELS_DIR / "stockout_model.pkl"


def _load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, encoding="latin-1")
    df["Unit_Price"] = (df["Sales"] / df["Quantity"]).replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=["Sub-Category", "Quantity", "Unit_Price"]).copy()
    df = df[df["Quantity"] > 0].copy()
    if "Order Date" in df.columns:
        df["Order Date"] = pd.to_datetime(df["Order Date"], errors="coerce")
        df = df.dropna(subset=["Order Date"]).copy()
    else:
        # This dataset variant has no date column, so create a stable synthetic timeline.
        df["Order Date"] = pd.date_range(start="2023-01-01", periods=len(df), freq="D")
    df["Month"] = df["Order Date"].dt.month
    return df


def summarize_dataset() -> dict:
    df = _load_dataset()
    top_subcategories = (
        df.groupby("Sub-Category")["Sales"]
        .sum()
        .sort_values(ascending=False)
        .head(3)
        .round(2)
    )
    return {
        "records": int(len(df)),
        "categories": int(df["Category"].nunique()),
        "subcategories": int(df["Sub-Category"].nunique()),
        "total_sales": round(float(df["Sales"].sum()), 2),
        "total_profit": round(float(df["Profit"].sum()), 2),
        "total_quantity": int(df["Quantity"].sum()),
        "average_discount": round(float(df["Discount"].mean()), 4),
        "top_subcategories": [
            {"name": name, "sales": float(value)} for name, value in top_subcategories.items()
        ],
        "data_notes": [
            "Demand prediction is trained from monthly quantity aggregated by sub-category and unit price.",
            "EOQ and reorder point are deterministic inventory formulas based on the predicted demand.",
            "Stockout risk uses a derived inventory label because the source CSV has no live warehouse stock column.",
        ],
    }


def train_and_save_models() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    df = _load_dataset()

    monthly = (
        df.groupby(["Month", "Sub-Category"], as_index=False)
        .agg({"Quantity": "sum", "Unit_Price": "mean"})
        .copy()
    )

    monthly["Sub-Category"] = pd.Categorical(monthly["Sub-Category"], categories=SUBCATEGORIES)
    encoded = pd.get_dummies(monthly, columns=["Sub-Category"])

    feature_columns = ["Month", "Unit_Price"] + [f"Sub-Category_{item}" for item in SUBCATEGORIES]
    for column in feature_columns:
        if column not in encoded.columns:
            encoded[column] = 0

    X_demand = encoded[feature_columns]
    y_demand = encoded["Quantity"]
    demand_model = LinearRegression()
    demand_model.fit(X_demand, y_demand)
    joblib.dump(demand_model, DEMAND_MODEL_PATH)

    risk_df = df.copy()
    monthly_mean = max(int(risk_df["Quantity"].mean()), 1)
    seeded_rng = np.random.default_rng(seed=42)
    risk_df["Current_Stock"] = seeded_rng.integers(
        low=max(10, monthly_mean // 2),
        high=max(100, monthly_mean * 3),
        size=len(risk_df),
    )
    risk_df["Stockout"] = (risk_df["Quantity"] > risk_df["Current_Stock"]).astype(int)

    X_risk = risk_df[["Quantity", "Current_Stock"]]
    y_risk = risk_df["Stockout"]
    risk_model = LogisticRegression(max_iter=1000)
    risk_model.fit(X_risk, y_risk)
    joblib.dump(risk_model, RISK_MODEL_PATH)


def ensure_models() -> tuple[object, object]:
    if not DEMAND_MODEL_PATH.exists() or not RISK_MODEL_PATH.exists():
        train_and_save_models()
    return joblib.load(DEMAND_MODEL_PATH), joblib.load(RISK_MODEL_PATH)


def build_demand_features(month: int, unit_price: float, sub_category: str) -> pd.DataFrame:
    payload = {"Month": month, "Unit_Price": unit_price}
    for category in SUBCATEGORIES:
        payload[f"Sub-Category_{category}"] = int(category == sub_category)
    return pd.DataFrame([payload])
