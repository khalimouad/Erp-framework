from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class QCResult(str, enum.Enum):
    pending = "pending"
    passed = "passed"
    failed = "failed"
    on_hold = "on_hold"


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(50), unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    quantity_checked = Column(Float, default=0.0)
    quantity_passed = Column(Float, default=0.0)
    quantity_failed = Column(Float, default=0.0)
    result = Column(Enum(QCResult), default=QCResult.pending)
    failure_reason = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", foreign_keys=[product_id])
    inspector = relationship("User", foreign_keys=[inspector_id])
