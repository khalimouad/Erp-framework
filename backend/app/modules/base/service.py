"""
Base module service.

bootstrap()         — called once at startup; scans manifests, seeds config & sequences
sync_states()       — marks currently-loaded modules as 'installed'
next_sequence()     — atomically increments and returns the next formatted sequence
get_config()        — read a config key
set_config()        — upsert a config key/value
install_module()    — mark a module as installed
uninstall_module()  — mark a module as uninstalled
"""

import importlib
import logging
import pathlib
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.modules.base.models import IrModule, IrConfig, IrSequence, IrRole, IrPermission
from app.modules.base.data import DEFAULT_CONFIGS, DEFAULT_SEQUENCES

logger = logging.getLogger(__name__)

_MODULES_DIR = pathlib.Path(__file__).parent.parent  # app/modules/


# ── bootstrap ─────────────────────────────────────────────────────────────────

async def bootstrap(db: AsyncSession) -> None:
    """
    Scan all module directories for a manifest.py, upsert IrModule rows,
    seed default config / sequence rows, and register module-declared roles.
    """
    await _sync_manifests(db)
    await _seed_configs(db)
    await _seed_sequences(db)
    await _sync_roles(db)
    await db.commit()
    logger.info("Base bootstrap complete")


async def _sync_manifests(db: AsyncSession) -> None:
    """Upsert one IrModule row per discovered manifest."""
    for module_dir in sorted(_MODULES_DIR.iterdir()):
        if not module_dir.is_dir() or module_dir.name.startswith("_"):
            continue
        try:
            mod = importlib.import_module(f"app.modules.{module_dir.name}.manifest")
            m = mod.MANIFEST
        except (ModuleNotFoundError, AttributeError):
            continue  # module has no manifest — skip silently

        result = await db.execute(
            select(IrModule).where(IrModule.name == m["name"])
        )
        existing = result.scalar_one_or_none()
        if existing is None:
            db.add(
                IrModule(
                    name=m["name"],
                    label=m.get("label", m["name"].capitalize()),
                    description=m.get("description"),
                    version=m.get("version", "1.0"),
                    category=m.get("category", "General"),
                    depends=m.get("depends", []),
                    auto_install=m.get("auto_install", False),
                    state="installed" if m.get("auto_install") else "uninstalled",
                )
            )
            logger.info(f"  [base] registered module: {m['name']}")
        else:
            # Refresh metadata from manifest (label/version/desc may change)
            existing.label = m.get("label", existing.label)
            existing.description = m.get("description", existing.description)
            existing.version = m.get("version", existing.version)
            existing.category = m.get("category", existing.category)
            existing.depends = m.get("depends", existing.depends)


async def _seed_configs(db: AsyncSession) -> None:
    """Insert default config keys — skip if key already exists."""
    for cfg in DEFAULT_CONFIGS:
        result = await db.execute(
            select(IrConfig).where(IrConfig.key == cfg["key"])
        )
        if result.scalar_one_or_none() is None:
            db.add(IrConfig(**cfg))


async def _seed_sequences(db: AsyncSession) -> None:
    """Insert default sequences — skip if code already exists."""
    for seq in DEFAULT_SEQUENCES:
        result = await db.execute(
            select(IrSequence).where(IrSequence.code == seq["code"])
        )
        if result.scalar_one_or_none() is None:
            db.add(IrSequence(**seq))


async def _sync_roles(db: AsyncSession) -> None:
    """
    Scan all manifests for a 'roles' key and upsert IrRole + IrPermission rows.

    Manifest role format:
        "roles": [
            {
                "name": "crm.manager",
                "label": "CRM Manager",
                "description": "...",
                "permissions": [
                    {"resource": "crm.lead", "read": True, "write": True, "create": True, "delete": True},
                ],
            },
        ]
    """
    for module_dir in sorted(_MODULES_DIR.iterdir()):
        if not module_dir.is_dir() or module_dir.name.startswith("_"):
            continue
        try:
            mod = importlib.import_module(f"app.modules.{module_dir.name}.manifest")
            m = mod.MANIFEST
        except (ModuleNotFoundError, AttributeError):
            continue

        for role_def in m.get("roles", []):
            # Upsert role
            res = await db.execute(select(IrRole).where(IrRole.name == role_def["name"]))
            role = res.scalar_one_or_none()
            if role is None:
                role = IrRole(
                    name=role_def["name"],
                    label=role_def.get("label", role_def["name"]),
                    module=m["name"],
                    description=role_def.get("description"),
                )
                db.add(role)
                await db.flush()
                logger.info(f"  [base] registered role: {role_def['name']}")
            else:
                role.label = role_def.get("label", role.label)
                role.description = role_def.get("description", role.description)

            # Upsert permissions
            for perm_def in role_def.get("permissions", []):
                p_res = await db.execute(
                    select(IrPermission).where(
                        IrPermission.role_id == role.id,
                        IrPermission.resource == perm_def["resource"],
                    )
                )
                perm = p_res.scalar_one_or_none()
                if perm is None:
                    db.add(IrPermission(
                        role_id=role.id,
                        resource=perm_def["resource"],
                        can_read=perm_def.get("read", True),
                        can_write=perm_def.get("write", False),
                        can_create=perm_def.get("create", False),
                        can_delete=perm_def.get("delete", False),
                    ))
                else:
                    perm.can_read = perm_def.get("read", perm.can_read)
                    perm.can_write = perm_def.get("write", perm.can_write)
                    perm.can_create = perm_def.get("create", perm.can_create)
                    perm.can_delete = perm_def.get("delete", perm.can_delete)


# ── state sync ────────────────────────────────────────────────────────────────

async def sync_states(db: AsyncSession, active_modules: list[str]) -> None:
    """
    After modules are loaded, mark them as 'installed' in ir_modules.
    Modules not in the active list are left at their current state.
    """
    now = datetime.now(timezone.utc)
    for name in active_modules:
        result = await db.execute(select(IrModule).where(IrModule.name == name))
        mod = result.scalar_one_or_none()
        if mod and mod.state != "installed":
            mod.state = "installed"
            mod.installed_at = now
    await db.commit()


# ── sequence ──────────────────────────────────────────────────────────────────

async def next_sequence(db: AsyncSession, code: str) -> str:
    """
    Atomically fetch and increment the next number for a sequence code.

    Example:
        await next_sequence(db, "sale.order")  # → "SO-00001"
    """
    result = await db.execute(
        select(IrSequence).where(IrSequence.code == code).with_for_update()
    )
    seq = result.scalar_one_or_none()
    if seq is None:
        raise ValueError(f"Sequence '{code}' not found. Add it to DEFAULT_SEQUENCES.")

    number = seq.next_number
    seq.next_number += 1
    formatted = f"{seq.prefix}{str(number).zfill(seq.padding)}"
    return formatted


# ── config ────────────────────────────────────────────────────────────────────

async def get_config(db: AsyncSession, key: str) -> IrConfig | None:
    result = await db.execute(select(IrConfig).where(IrConfig.key == key))
    return result.scalar_one_or_none()


async def get_config_value(db: AsyncSession, key: str, default: str = "") -> str:
    cfg = await get_config(db, key)
    return cfg.value if cfg and cfg.value is not None else default


async def list_configs(db: AsyncSession, group: str | None = None) -> list[IrConfig]:
    q = select(IrConfig)
    if group:
        q = q.where(IrConfig.group == group)
    result = await db.execute(q.order_by(IrConfig.group, IrConfig.key))
    return list(result.scalars().all())


async def set_config(db: AsyncSession, key: str, value: str) -> IrConfig:
    result = await db.execute(select(IrConfig).where(IrConfig.key == key))
    cfg = result.scalar_one_or_none()
    if cfg is None:
        cfg = IrConfig(key=key, value=value)
        db.add(cfg)
    else:
        cfg.value = value
    await db.flush()
    await db.refresh(cfg)
    return cfg


# ── module install / uninstall ────────────────────────────────────────────────

async def list_modules(db: AsyncSession) -> list[IrModule]:
    result = await db.execute(select(IrModule).order_by(IrModule.category, IrModule.name))
    return list(result.scalars().all())


async def get_module(db: AsyncSession, name: str) -> IrModule:
    from fastapi import HTTPException
    result = await db.execute(select(IrModule).where(IrModule.name == name))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail=f"Module '{name}' not found")
    return mod


async def install_module(db: AsyncSession, name: str) -> IrModule:
    mod = await get_module(db, name)
    mod.state = "installed"
    mod.installed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(mod)
    return mod


# ── roles ─────────────────────────────────────────────────────────────────────

async def list_roles(db: AsyncSession, module: str | None = None) -> list[IrRole]:
    from sqlalchemy.orm import selectinload
    q = select(IrRole).options(selectinload(IrRole.permissions))
    if module:
        q = q.where(IrRole.module == module)
    result = await db.execute(q.order_by(IrRole.module, IrRole.name))
    return list(result.scalars().all())


async def get_role(db: AsyncSession, role_id: int) -> IrRole:
    from fastapi import HTTPException
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(IrRole).options(selectinload(IrRole.permissions)).where(IrRole.id == role_id)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


# ── module install / uninstall ────────────────────────────────────────────────

async def uninstall_module(db: AsyncSession, name: str) -> IrModule:
    from fastapi import HTTPException
    mod = await get_module(db, name)
    if mod.auto_install:
        raise HTTPException(
            status_code=400,
            detail=f"Module '{name}' is a core module and cannot be uninstalled.",
        )
    mod.state = "uninstalled"
    mod.installed_at = None
    await db.flush()
    await db.refresh(mod)
    return mod
