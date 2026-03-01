"""
Module loader — discovers and registers ERP modules (addons).
Each module lives in app/modules/<name>/ and exports a `router` and optional `models`.

To create a new module:
  1. Create app/modules/<name>/
  2. Add __init__.py, models.py, schemas.py, router.py, service.py
  3. Register the module name in INSTALLED_MODULES below
"""

from fastapi import FastAPI
import importlib
import logging

logger = logging.getLogger(__name__)

# Registry — add module names here to enable them
INSTALLED_MODULES = [
    "users",
    "companies",
    "crm",
    "inventory",
    "hr",
]


def load_modules(app: FastAPI) -> None:
    """Dynamically import and register all installed module routers."""
    for module_name in INSTALLED_MODULES:
        try:
            mod = importlib.import_module(f"app.modules.{module_name}.router")
            router = getattr(mod, "router", None)
            if router:
                app.include_router(router, prefix=f"/api/v1/{module_name}", tags=[module_name.capitalize()])
                logger.info(f"Module loaded: {module_name}")
            else:
                logger.warning(f"Module '{module_name}' has no router")
        except ModuleNotFoundError:
            logger.warning(f"Module '{module_name}' not found — skipping")
        except Exception as e:
            logger.error(f"Failed to load module '{module_name}': {e}")
