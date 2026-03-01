from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.purchasing.models import POStatus


class POLineCreate(BaseModel):
    product_id: Optional[int] = None
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0


class POLineOut(BaseModel):
    id: int
    product_id: Optional[int]
    description: str
    quantity: float
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class POCreate(BaseModel):
    vendor_name: str
    vendor_email: Optional[EmailStr] = None
    company_id: Optional[int] = None
    notes: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    lines: list[POLineCreate] = []


class POUpdate(BaseModel):
    vendor_name: Optional[str] = None
    status: Optional[POStatus] = None
    notes: Optional[str] = None
    expected_delivery: Optional[datetime] = None


class POOut(BaseModel):
    id: int
    reference: str
    vendor_name: str
    vendor_email: Optional[str]
    company_id: Optional[int]
    buyer_id: Optional[int]
    status: POStatus
    total_amount: float
    notes: Optional[str]
    expected_delivery: Optional[datetime]
    created_at: datetime
    lines: list[POLineOut] = []

    model_config = {"from_attributes": True}
