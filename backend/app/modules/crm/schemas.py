from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.crm.models import LeadStatus


class LeadCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_id: Optional[int] = None
    assigned_to: Optional[int] = None
    status: LeadStatus = LeadStatus.new
    expected_revenue: float = 0.0
    description: Optional[str] = None
    expected_close_date: Optional[datetime] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    assigned_to: Optional[int] = None
    status: Optional[LeadStatus] = None
    expected_revenue: Optional[float] = None
    description: Optional[str] = None
    expected_close_date: Optional[datetime] = None


class LeadOut(BaseModel):
    id: int
    name: str
    contact_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    company_id: Optional[int]
    assigned_to: Optional[int]
    status: LeadStatus
    expected_revenue: float
    description: Optional[str]
    expected_close_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    activity_type: str
    summary: str


class ActivityOut(BaseModel):
    id: int
    lead_id: int
    user_id: int
    activity_type: str
    summary: str
    created_at: datetime

    model_config = {"from_attributes": True}
