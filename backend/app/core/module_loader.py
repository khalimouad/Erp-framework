"""
Module loader — discovers and registers ERP modules based on the active vertical.

Verticals define which module bundles are activated:
  - general      : Full ERP (all modules)
  - trading      : crm + inventory + sales + purchasing
  - medical      : hr + medical (patients, appointments, prescriptions, pharmacy)
  - manufacturing: inventory + manufacturing + quality + purchasing + hr

To create a new module:
  1. Create app/modules/<name>/
  2. Add __init__.py, models.py, schemas.py, router.py, service.py
  3. Register it in VERTICAL_MODULES below
"""

from fastapi import FastAPI
import importlib
import logging
from app.config import Vertical

logger = logging.getLogger(__name__)

# Core modules always loaded regardless of vertical
CORE_MODULES = ["users", "companies"]

# Per-vertical module bundles (appended to CORE_MODULES)
VERTICAL_MODULES: dict[str, list[str]] = {
    Vertical.general: [
        "crm",
        "inventory",
        "sales",
        "purchasing",
        "hr",
        "accounting",
    ],
    Vertical.trading: [
        "crm",
        "inventory",
        "sales",
        "purchasing",
    ],
    Vertical.medical: [
        "hr",
        "medical",
    ],
    Vertical.manufacturing: [
        "inventory",
        "manufacturing",
        "purchasing",
        "hr",
        "quality",
    ],
}


def get_active_modules(vertical: Vertical) -> list[str]:
    return CORE_MODULES + VERTICAL_MODULES.get(vertical, [])


def load_modules(app: FastAPI) -> None:
    """Dynamically import and register all module routers for the active vertical."""
    from app.config import settings

    modules = get_active_modules(settings.VERTICAL)
    logger.info(f"Vertical: '{settings.VERTICAL}' — modules: {modules}")

    for module_name in modules:
        try:
            mod = importlib.import_module(f"app.modules.{module_name}.router")
            router = getattr(mod, "router", None)
            if router:
                app.include_router(
                    router,
                    prefix=f"/api/v1/{module_name}",
                    tags=[module_name.capitalize()],
                )
                logger.info(f"  + {module_name}")
            else:
                logger.warning(f"  - {module_name}: no router found")
        except ModuleNotFoundError:
            logger.warning(f"  - {module_name}: folder not found, skipping")
        except Exception as e:
            logger.error(f"  - {module_name}: failed — {e}")
