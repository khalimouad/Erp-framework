from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.modules.manufacturing.models import WorkOrderStatus


class BOMLineCreate(BaseModel):
    component_id: int
    quantity: float = 1.0
    unit_of_measure: str = "unit"
    notes: Optional[str] = None


class BOMLineOut(BaseModel):
    id: int
    component_id: int
    quantity: float
    unit_of_measure: str
    notes: Optional[str]

    model_config = {"from_attributes": True}


class BOMCreate(BaseModel):
    product_id: int
    reference: Optional[str] = None
    quantity: float = 1.0
    notes: Optional[str] = None
    components: list[BOMLineCreate] = []


class BOMUpdate(BaseModel):
    reference: Optional[str] = None
    quantity: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class BOMOut(BaseModel):
    id: int
    product_id: int
    reference: Optional[str]
    quantity: float
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    components: list[BOMLineOut] = []

    model_config = {"from_attributes": True}


class WorkOrderCreate(BaseModel):
    bom_id: int
    quantity_planned: float = 1.0
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    responsible_id: Optional[int] = None
    notes: Optional[str] = None


class WorkOrderUpdate(BaseModel):
    status: Optional[WorkOrderStatus] = None
    quantity_produced: Optional[float] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    notes: Optional[str] = None


class WorkOrderOut(BaseModel):
    id: int
    reference: str
    bom_id: int
    quantity_planned: float
    quantity_produced: float
    status: WorkOrderStatus
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    actual_start: Optional[datetime]
    actual_end: Optional[datetime]
    responsible_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
