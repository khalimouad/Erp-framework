from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from fastapi import HTTPException, status

from app.modules.users.models import User, IrUserRole
from app.modules.users.schemas import UserCreate, UserUpdate, RoleAssign
from app.core.security import hash_password, verify_password, create_access_token


def _user_query():
    """Base query that eager-loads ir_user_roles → role."""
    return select(User).options(
        selectinload(User.ir_user_roles).selectinload(IrUserRole.role)
    )


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        company_id=data.company_id,
        is_superadmin=data.is_superadmin or False,
    )
    db.add(user)
    await db.flush()
    # Reload with relationships
    result = await db.execute(_user_query().where(User.id == user.id))
    return result.scalar_one()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict:
    result = await db.execute(_user_query().where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token(str(user.id), {"email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}


async def get_user(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(_user_query().where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def list_users(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[User]:
    result = await db.execute(_user_query().offset(skip).limit(limit))
    return list(result.scalars().all())


async def update_user(db: AsyncSession, user_id: int, data: UserUpdate) -> User:
    user = await get_user(db, user_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.flush()
    result = await db.execute(_user_query().where(User.id == user_id))
    return result.scalar_one()


# ── Role assignment ───────────────────────────────────────────────────────────

async def assign_role(db: AsyncSession, user_id: int, role_id: int) -> IrUserRole:
    # Verify user exists
    await get_user(db, user_id)

    # Verify role exists
    from app.modules.base.models import IrRole
    role_res = await db.execute(select(IrRole).where(IrRole.id == role_id))
    if not role_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Role not found")

    # Check not already assigned
    existing = await db.execute(
        select(IrUserRole).where(
            IrUserRole.user_id == user_id,
            IrUserRole.role_id == role_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Role already assigned to this user")

    ur = IrUserRole(user_id=user_id, role_id=role_id)
    db.add(ur)
    await db.flush()
    result = await db.execute(
        select(IrUserRole)
        .options(selectinload(IrUserRole.role))
        .where(IrUserRole.id == ur.id)
    )
    return result.scalar_one()


async def revoke_role(db: AsyncSession, user_id: int, role_id: int) -> None:
    result = await db.execute(
        select(IrUserRole).where(
            IrUserRole.user_id == user_id,
            IrUserRole.role_id == role_id,
        )
    )
    ur = result.scalar_one_or_none()
    if not ur:
        raise HTTPException(status_code=404, detail="Role not assigned to this user")
    await db.delete(ur)


async def list_user_roles(db: AsyncSession, user_id: int) -> list[IrUserRole]:
    result = await db.execute(
        select(IrUserRole)
        .options(selectinload(IrUserRole.role))
        .where(IrUserRole.user_id == user_id)
    )
    return list(result.scalars().all())
