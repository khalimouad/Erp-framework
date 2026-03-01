from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class WorkOrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    in_progress = "in_progress"
    done = "done"
    cancelled = "cancelled"


class BillOfMaterials(Base):
    """Recipe for manufacturing a product."""
    __tablename__ = "bom"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)  # finished good
    reference = Column(String(100), nullable=True)
    quantity = Column(Float, default=1.0)   # quantity of finished good produced
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", foreign_keys=[product_id])
    components = relationship("BOMLine", back_populates="bom", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="bom")


class BOMLine(Base):
    """One component row in a Bill of Materials."""
    __tablename__ = "bom_lines"

    id = Column(Integer, primary_key=True)
    bom_id = Column(Integer, ForeignKey("bom.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_of_measure = Column(String(50), default="unit")
    notes = Column(Text, nullable=True)

    bom = relationship("BillOfMaterials", back_populates="components")
    component = relationship("Product", foreign_keys=[component_id])


class WorkOrder(Base):
    """A production order to manufacture a quantity of a product."""
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(50), unique=True, nullable=False)
    bom_id = Column(Integer, ForeignKey("bom.id"), nullable=False)
    quantity_planned = Column(Float, nullable=False, default=1.0)
    quantity_produced = Column(Float, default=0.0)
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.draft)
    scheduled_start = Column(DateTime(timezone=True), nullable=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    responsible_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bom = relationship("BillOfMaterials", back_populates="work_orders")
    responsible = relationship("User", foreign_keys=[responsible_id])
