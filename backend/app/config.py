from pydantic_settings import BaseSettings
from typing import List
from enum import Enum


class Vertical(str, Enum):
    """
    Business vertical — controls which modules are loaded.
    Set VERTICAL in .env to switch industry profiles.
    """
    general = "general"              # Full ERP (all modules)
    trading = "trading"              # Buy, sell, manage stock
    medical = "medical"              # Clinic / hospital
    manufacturing = "manufacturing"  # Factory / production


class Settings(BaseSettings):
    APP_NAME: str = "NextERP"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Active vertical — determines which modules load
    VERTICAL: Vertical = Vertical.general

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://erp_user:erp_pass@localhost:5432/erp_db"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Superadmin seed
    SUPERADMIN_EMAIL: str = "admin@nexterp.com"
    SUPERADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"


settings = Settings()
