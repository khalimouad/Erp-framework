from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class POStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    received = "received"
    cancelled = "cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(50), unique=True, nullable=False)
    vendor_name = Column(String(255), nullable=False)
    vendor_email = Column(String(255), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(POStatus), default=POStatus.draft)
    notes = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0)
    expected_delivery = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lines = relationship("PurchaseOrderLine", back_populates="order", cascade="all, delete-orphan")


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False, default=0.0)

    order = relationship("PurchaseOrder", back_populates="lines")
    product = relationship("Product")
