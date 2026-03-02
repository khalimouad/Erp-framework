from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Role info embedded in user responses ──────────────────────────────────────

class RoleInfo(BaseModel):
    id: int
    name: str
    label: str
    module: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserRoleOut(BaseModel):
    id: int
    role_id: int
    role: RoleInfo
    assigned_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── User schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    company_id: Optional[int] = None
    is_superadmin: Optional[bool] = False


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superadmin: Optional[bool] = None
    company_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_superadmin: bool
    company_id: Optional[int]
    created_at: datetime
    # Roles are eager-loaded with selectinload in service functions
    ir_user_roles: list[UserRoleOut] = []

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Role assignment ───────────────────────────────────────────────────────────

class RoleAssign(BaseModel):
    role_id: int
