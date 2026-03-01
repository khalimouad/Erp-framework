from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.sales.models import SaleOrderStatus


class SaleOrderLineCreate(BaseModel):
    product_id: Optional[int] = None
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0


class SaleOrderLineOut(BaseModel):
    id: int
    product_id: Optional[int]
    description: str
    quantity: float
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class SaleOrderCreate(BaseModel):
    customer_name: str
    customer_email: Optional[EmailStr] = None
    company_id: Optional[int] = None
    salesperson_id: Optional[int] = None
    notes: Optional[str] = None
    lines: list[SaleOrderLineCreate] = []


class SaleOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    status: Optional[SaleOrderStatus] = None
    notes: Optional[str] = None


class SaleOrderOut(BaseModel):
    id: int
    reference: str
    customer_name: str
    customer_email: Optional[str]
    company_id: Optional[int]
    salesperson_id: Optional[int]
    status: SaleOrderStatus
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    lines: list[SaleOrderLineOut] = []

    model_config = {"from_attributes": True}
