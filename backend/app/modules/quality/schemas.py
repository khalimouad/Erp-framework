from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.modules.quality.models import QCResult


class QCCreate(BaseModel):
    product_id: Optional[int] = None
    work_order_id: Optional[int] = None
    quantity_checked: float = 0.0
    quantity_passed: float = 0.0
    quantity_failed: float = 0.0
    result: QCResult = QCResult.pending
    failure_reason: Optional[str] = None
    corrective_action: Optional[str] = None
    checked_at: Optional[datetime] = None


class QCUpdate(BaseModel):
    quantity_passed: Optional[float] = None
    quantity_failed: Optional[float] = None
    result: Optional[QCResult] = None
    failure_reason: Optional[str] = None
    corrective_action: Optional[str] = None
    checked_at: Optional[datetime] = None


class QCOut(BaseModel):
    id: int
    reference: str
    product_id: Optional[int]
    work_order_id: Optional[int]
    inspector_id: Optional[int]
    quantity_checked: float
    quantity_passed: float
    quantity_failed: float
    result: QCResult
    failure_reason: Optional[str]
    corrective_action: Optional[str]
    checked_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
