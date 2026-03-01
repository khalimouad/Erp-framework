from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class LeadStatus(str, enum.Enum):
    new = "new"
    qualified = "qualified"
    proposition = "proposition"
    won = "won"
    lost = "lost"


class Lead(Base):
    __tablename__ = "crm_leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # Opportunity / Lead name
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(LeadStatus), default=LeadStatus.new)
    expected_revenue = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    expected_close_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company")
    assignee = relationship("User", foreign_keys=[assigned_to])
    activities = relationship("CrmActivity", back_populates="lead", cascade="all, delete-orphan")


class CrmActivity(Base):
    __tablename__ = "crm_activities"

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey("crm_leads.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(50))  # call, email, meeting, note
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User")
