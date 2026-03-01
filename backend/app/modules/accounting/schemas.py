from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.modules.accounting.models import InvoiceType, InvoiceStatus, PaymentMethod


class InvoiceLineCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    tax_rate: float = 0.0


class InvoiceLineOut(BaseModel):
    id: int
    description: str
    quantity: float
    unit_price: float
    tax_rate: float
    subtotal: float

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    invoice_type: InvoiceType
    partner_name: str
    partner_email: Optional[EmailStr] = None
    company_id: Optional[int] = None
    issue_date: date
    due_date: Optional[date] = None
    notes: Optional[str] = None
    lines: list[InvoiceLineCreate] = []


class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class InvoiceOut(BaseModel):
    id: int
    reference: str
    invoice_type: InvoiceType
    partner_name: str
    partner_email: Optional[str]
    company_id: Optional[int]
    issue_date: date
    due_date: Optional[date]
    status: InvoiceStatus
    subtotal: float
    tax_amount: float
    total_amount: float
    amount_paid: float
    notes: Optional[str]
    created_at: datetime
    lines: list[InvoiceLineOut] = []

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    amount: float
    payment_date: date
    method: PaymentMethod = PaymentMethod.bank_transfer
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_date: date
    method: PaymentMethod
    reference: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
