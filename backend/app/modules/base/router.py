from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user, require_superadmin
from app.modules.base import schemas, service

router = APIRouter()


# ── Modules ───────────────────────────────────────────────────────────────────

@router.get("/modules", response_model=list[schemas.ModuleOut])
async def list_modules(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """List all registered modules with their install state."""
    return await service.list_modules(db)


@router.post("/modules/{name}/install", response_model=schemas.ModuleOut)
async def install_module(
    name: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    """Mark a module as installed (superadmin only)."""
    return await service.install_module(db, name)


@router.post("/modules/{name}/uninstall", response_model=schemas.ModuleOut)
async def uninstall_module(
    name: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    """Mark a module as uninstalled (superadmin only). Core modules are protected."""
    return await service.uninstall_module(db, name)


# ── Configuration ─────────────────────────────────────────────────────────────

@router.get("/config", response_model=list[schemas.ConfigOut])
async def list_config(
    group: str | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """List all config entries, optionally filtered by group."""
    return await service.list_configs(db, group)


@router.get("/config/{key:path}", response_model=schemas.ConfigOut)
async def get_config(
    key: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    cfg = await service.get_config(db, key)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Config key '{key}' not found")
    return cfg


@router.put("/config/{key:path}", response_model=schemas.ConfigOut)
async def set_config(
    key: str,
    body: schemas.ConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    """Create or update a config value (superadmin only)."""
    return await service.set_config(db, key, body.value or "")


@router.post("/config", response_model=schemas.ConfigOut, status_code=201)
async def create_config(
    body: schemas.ConfigCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    """Create a new config entry (superadmin only)."""
    existing = await service.get_config(db, body.key)
    if existing:
        raise HTTPException(status_code=409, detail="Config key already exists")
    from app.modules.base.models import IrConfig
    cfg = IrConfig(**body.model_dump())
    db.add(cfg)
    await db.flush()
    await db.refresh(cfg)
    return cfg


# ── Sequences ─────────────────────────────────────────────────────────────────

@router.get("/sequences", response_model=list[schemas.SequenceOut])
async def list_sequences(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    from sqlalchemy import select
    from app.modules.base.models import IrSequence
    result = await db.execute(select(IrSequence).order_by(IrSequence.code))
    return list(result.scalars().all())
