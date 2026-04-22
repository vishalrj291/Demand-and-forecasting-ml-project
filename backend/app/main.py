from __future__ import annotations

import math
import os
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .ml import build_demand_features, ensure_models, summarize_dataset
from .schemas import DemandPredictionRequest, InventoryRequest, RiskPredictionRequest, SUBCATEGORIES

demand_model = None
risk_model = None
dataset_summary = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global demand_model, risk_model, dataset_summary
    demand_model, risk_model = ensure_models()
    dataset_summary = summarize_dataset()
    yield


app = FastAPI(
    title="Demand Forecasting API",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Demand Forecasting API is running.",
        "sub_categories": SUBCATEGORIES,
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/insights")
def insights():
    return dataset_summary


@app.post("/api/predict/demand")
def predict_demand(payload: DemandPredictionRequest):
    features = build_demand_features(
        month=payload.month,
        unit_price=payload.unit_price,
        sub_category=payload.sub_category,
    )
    prediction = float(demand_model.predict(features)[0])
    predicted_demand = max(0, int(round(prediction)))
    return {
        "predicted_demand": predicted_demand,
        "inputs": payload.model_dump(),
    }


@app.post("/api/calculate/inventory")
def calculate_inventory(payload: InventoryRequest):
    annual_demand = payload.predicted_demand * 12
    eoq = math.sqrt((2 * annual_demand * payload.ordering_cost) / payload.holding_cost) if annual_demand else 0
    average_daily_demand = payload.predicted_demand / 30 if payload.predicted_demand else 0
    reorder_point = (average_daily_demand * payload.lead_time_days) + payload.safety_stock

    return {
        "annual_demand": annual_demand,
        "average_daily_demand": round(average_daily_demand, 2),
        "economic_order_quantity": int(round(eoq)),
        "reorder_point": int(round(reorder_point)),
    }


@app.post("/api/predict/risk")
def predict_risk(payload: RiskPredictionRequest):
    features = np.array([[payload.predicted_demand, payload.inventory_level]])
    prediction = int(risk_model.predict(features)[0])
    probabilities = risk_model.predict_proba(features)[0].tolist()
    return {
        "risk_level": "high" if prediction == 1 else "low",
        "prediction": prediction,
        "probabilities": {
            "low": round(probabilities[0], 4),
            "high": round(probabilities[1], 4),
        },
        "inputs": payload.model_dump(),
    }
