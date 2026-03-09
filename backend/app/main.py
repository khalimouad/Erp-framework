from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import create_all_tables
from app.core.module_loader import (
    load_modules,
    set_installed_modules,
    is_module_installed,
    CORE_MODULES,
    scan_all_modules,
    get_installed_modules,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NextERP — creating tables...")
    await create_all_tables()

    from app.database import AsyncSessionLocal
    from app.modules.base import service as base_svc
    from app.modules.base.service import list_modules

    async with AsyncSessionLocal() as db:
        # Scan manifests, seed config/sequences/roles
        await base_svc.bootstrap(db)
        # Sync in-memory installed set from DB state
        all_mods = await list_modules(db)
        installed = [m.name for m in all_mods if m.state == "installed"]
        set_installed_modules(installed)

    await seed_superadmin()
    yield
    logger.info("NextERP shutting down")


async def seed_superadmin():
    """Create default superadmin on first run."""
    from app.database import AsyncSessionLocal
    from app.modules.users.models import User
    from app.core.security import hash_password
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == settings.SUPERADMIN_EMAIL))
        if result.scalar_one_or_none() is None:
            admin = User(
                email=settings.SUPERADMIN_EMAIL,
                full_name="Super Admin",
                hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
                is_superadmin=True,
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            logger.info(f"Superadmin created: {settings.SUPERADMIN_EMAIL}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Modular ERP Framework built with FastAPI + SQLAlchemy + React",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def module_gate(request: Request, call_next):
    """
    Block requests to module API routes that are not installed.

    Paths like /api/v1/{module}/... are checked against the in-memory
    installed-modules set. Core modules (base, users, companies, ai) are
    always accessible. Returns 404 for uninstalled modules.
    """
    path = request.url.path
    if path.startswith("/api/v1/"):
        segment = path[len("/api/v1/"):].split("/")[0]
        if segment and segment not in CORE_MODULES and not is_module_installed(segment):
            return JSONResponse(
                status_code=404,
                content={"detail": f"Module '{segment}' is not installed"},
            )
    return await call_next(request)


# Register ALL discovered module routers (gated at runtime by module_gate)
load_modules(app)


@app.get("/", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "installed_modules": sorted(get_installed_modules()),
        "available_modules": scan_all_modules(),
    }
