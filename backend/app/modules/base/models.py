"""
Base module models — installed automatically on first boot.

IrModule   : registry of all known modules and their install state
IrConfig   : system-wide key/value configuration store
IrSequence : auto-increment sequence generator (SO-00001, PO-00001, …)
"""

from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class IrModule(Base):
    """Registry of all framework modules with their installation state."""

    __tablename__ = "ir_modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(50), default="1.0")
    category = Column(String(100), default="General")
    # installed | uninstalled | to_install | to_upgrade
    state = Column(String(50), nullable=False, default="uninstalled")
    depends = Column(JSON, nullable=False, default=list)
    auto_install = Column(Boolean, default=False)
    installed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class IrConfig(Base):
    """Key/value store for system-wide configuration parameters."""

    __tablename__ = "ir_config"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    description = Column(String(500), nullable=True)
    # general | security | mail | accounting | hr
    group = Column(String(100), nullable=False, default="general")
    # string | integer | boolean | json
    value_type = Column(String(50), nullable=False, default="string")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class IrSequence(Base):
    """
    Auto-incrementing sequence generator.

    Usage (from any module service):
        from app.modules.base.service import next_sequence
        ref = await next_sequence(db, "sale.order")   # → "SO-00001"
    """

    __tablename__ = "ir_sequences"

    id = Column(Integer, primary_key=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    prefix = Column(String(50), nullable=False)
    padding = Column(Integer, nullable=False, default=5)
    next_number = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
