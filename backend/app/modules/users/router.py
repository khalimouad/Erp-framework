from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user, require_superadmin
from app.modules.users import schemas, service

router = APIRouter()


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/auth/token", response_model=schemas.TokenResponse, tags=["Auth"])
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await service.authenticate_user(db, form.username, form.password)


@router.get("/me", response_model=schemas.UserOut)
async def me(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Re-fetch with eager role loading
    return await service.get_user(db, current_user.id)


# ── Users CRUD ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[schemas.UserOut])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.list_users(db, skip, limit)


@router.post("/", response_model=schemas.UserOut, status_code=201)
async def create_user(
    data: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.create_user(db, data)


@router.get("/{user_id}", response_model=schemas.UserOut)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.get_user(db, user_id)


@router.patch("/{user_id}", response_model=schemas.UserOut)
async def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.update_user(db, user_id, data)


# ── Role assignment ───────────────────────────────────────────────────────────

@router.get("/{user_id}/roles", response_model=list[schemas.UserRoleOut])
async def list_user_roles(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """List roles currently assigned to a user."""
    return await service.list_user_roles(db, user_id)


@router.post("/{user_id}/roles", response_model=schemas.UserRoleOut, status_code=201)
async def assign_role(
    user_id: int,
    body: schemas.RoleAssign,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    """Assign a role to a user (superadmin only)."""
    return await service.assign_role(db, user_id, body.role_id)


@router.delete("/{user_id}/roles/{role_id}", status_code=204)
async def revoke_role(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    """Revoke a role from a user (superadmin only)."""
    await service.revoke_role(db, user_id, role_id)
