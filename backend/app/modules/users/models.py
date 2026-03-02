from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superadmin = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="users")
    # Dynamic roles — linked to IrRole records seeded from module manifests
    ir_user_roles = relationship(
        "IrUserRole", back_populates="user", cascade="all, delete-orphan"
    )


class IrUserRole(Base):
    """
    Links a User to an IrRole (defined by base module from manifests).
    Use POST /users/{id}/roles to assign, DELETE to revoke.
    """

    __tablename__ = "ir_user_roles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("ir_roles.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ir_user_roles")
    role = relationship("IrRole")  # IrRole lives in base — referenced by name only

    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_ir_user_role"),)
