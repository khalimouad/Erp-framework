from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    unit_price: float = 0.0
    cost_price: float = 0.0
    unit_of_measure: str = "unit"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    description: Optional[str]
    category_id: Optional[int]
    unit_price: float
    cost_price: float
    unit_of_measure: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StockMoveCreate(BaseModel):
    product_id: int
    warehouse_id: int
    move_type: str  # "in" | "out" | "adjustment"
    quantity: float
    reference: Optional[str] = None
    notes: Optional[str] = None


class StockMoveOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    move_type: str
    quantity: float
    reference: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class StockLevelOut(BaseModel):
    product_id: int
    warehouse_id: int
    quantity_on_hand: float
