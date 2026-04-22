from typing import Literal

from pydantic import BaseModel, Field


SUBCATEGORIES = [
    "Accessories",
    "Appliances",
    "Art",
    "Binders",
    "Bookcases",
    "Chairs",
    "Copiers",
    "Envelopes",
    "Fasteners",
    "Furnishings",
    "Labels",
    "Machines",
    "Paper",
    "Phones",
    "Storage",
    "Supplies",
    "Tables",
]

SubCategory = Literal[
    "Accessories",
    "Appliances",
    "Art",
    "Binders",
    "Bookcases",
    "Chairs",
    "Copiers",
    "Envelopes",
    "Fasteners",
    "Furnishings",
    "Labels",
    "Machines",
    "Paper",
    "Phones",
    "Storage",
    "Supplies",
    "Tables",
]


class DemandPredictionRequest(BaseModel):
    month: int = Field(..., ge=1, le=12)
    unit_price: float = Field(..., gt=0)
    sub_category: SubCategory


class RiskPredictionRequest(BaseModel):
    predicted_demand: int = Field(..., ge=0)
    inventory_level: int = Field(..., ge=0)


class InventoryRequest(BaseModel):
    predicted_demand: int = Field(..., ge=0)
    ordering_cost: float = Field(..., gt=0)
    holding_cost: float = Field(..., gt=0)
    lead_time_days: int = Field(..., ge=0)
    safety_stock: int = Field(..., ge=0)
