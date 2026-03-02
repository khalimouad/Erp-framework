from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.users.models import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


async def require_superadmin(current_user=Depends(get_current_user)):
    if not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return current_user


def require_permission(resource: str, action: str = "read"):
    """
    FastAPI dependency factory — checks the current user has the required
    permission on the given resource before the endpoint runs.

    Superadmin bypasses all permission checks automatically.

    Actions: read | write | create | delete

    Usage:
        @router.delete("/{id}")
        async def delete_lead(
            id: int,
            user=Depends(require_permission("crm.lead", "delete")),
            db=Depends(get_db),
        ):
            ...
    """
    async def _check(
        current_user=Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        if current_user.is_superadmin:
            return current_user

        from app.modules.users.models import IrUserRole
        from app.modules.base.models import IrPermission

        action_col = {
            "read":   IrPermission.can_read,
            "write":  IrPermission.can_write,
            "create": IrPermission.can_create,
            "delete": IrPermission.can_delete,
        }.get(action)

        if action_col is None:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown permission action '{action}'. Use: read, write, create, delete",
            )

        q = (
            select(IrPermission.id)
            .join(IrUserRole, IrUserRole.role_id == IrPermission.role_id)
            .where(
                IrUserRole.user_id == current_user.id,
                IrPermission.resource == resource,
                action_col.is_(True),
            )
            .limit(1)
        )
        result = await db.execute(q)
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: '{action}' on '{resource}'",
            )
        return current_user

    return _check
