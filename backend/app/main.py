from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import create_all_tables
from app.core.module_loader import load_modules, get_active_modules

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NextERP — creating tables...")
    await create_all_tables()
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

# Register all module routers
load_modules(app)


@app.get("/", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "vertical": settings.VERTICAL,
        "modules": get_active_modules(settings.VERTICAL),
    }
