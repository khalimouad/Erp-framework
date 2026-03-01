from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CompanyCreate(BaseModel):
    name: str
    tax_id: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    currency: str = "USD"


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyOut(BaseModel):
    id: int
    name: str
    tax_id: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    country: Optional[str]
    currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
