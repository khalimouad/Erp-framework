from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class SaleOrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    shipped = "shipped"
    invoiced = "invoiced"
    cancelled = "cancelled"


class SaleOrder(Base):
    __tablename__ = "sale_orders"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(50), unique=True, nullable=False)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    salesperson_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(SaleOrderStatus), default=SaleOrderStatus.draft)
    notes = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lines = relationship("SaleOrderLine", back_populates="order", cascade="all, delete-orphan")
    salesperson = relationship("User", foreign_keys=[salesperson_id])


class SaleOrderLine(Base):
    __tablename__ = "sale_order_lines"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("sale_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False, default=0.0)

    order = relationship("SaleOrder", back_populates="lines")
    product = relationship("Product")
