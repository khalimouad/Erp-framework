"""
Module loader — discovers and registers ALL ERP modules at startup.

Every module with a manifest.py in app/modules/ is loaded into the FastAPI
router. Which modules are *active* is controlled by the IrModule.state field
in the database (populated at bootstrap). The module_gate middleware (in main.py)
rejects requests to routes whose module is not installed.

To create a new module:
  1. Create app/modules/<name>/
  2. Add __init__.py, manifest.py, models.py, schemas.py, router.py, service.py
  3. It will be auto-discovered — no registration needed here
"""

from fastapi import FastAPI
import importlib
import pathlib
import logging
from app.config import Vertical

logger = logging.getLogger(__name__)

# Core modules are always accessible regardless of install state.
# Requests to these modules are never blocked by the gate middleware.
CORE_MODULES: set[str] = {"base", "users", "companies", "ai"}

# In-memory set of currently installed module names.
# Initialized during app lifespan from the DB; updated on install/uninstall.
_installed_modules: set[str] = set(CORE_MODULES)

_MODULES_DIR = pathlib.Path(__file__).parent.parent / "modules"

# ── Legacy vertical support (kept for backward compatibility) ─────────────────

VERTICAL_MODULES: dict[str, list[str]] = {
    Vertical.general: ["crm", "inventory", "sales", "purchasing", "hr", "accounting"],
    Vertical.trading: ["crm", "inventory", "sales", "purchasing"],
    Vertical.medical: ["hr", "medical"],
    Vertical.manufacturing: ["inventory", "manufacturing", "purchasing", "hr", "quality"],
}


def get_active_modules(vertical: Vertical) -> list[str]:
    """Return core + vertical module names (used by legacy sync_states)."""
    return list(CORE_MODULES) + VERTICAL_MODULES.get(vertical, [])


# ── In-memory install state ───────────────────────────────────────────────────

def set_installed_modules(names: list[str]) -> None:
    """Populate the in-memory set from DB state. Called during lifespan."""
    global _installed_modules
    _installed_modules = set(CORE_MODULES) | set(names)
    logger.info(f"Installed modules: {sorted(_installed_modules)}")


def is_module_installed(name: str) -> bool:
    return name in _installed_modules


def mark_installed(name: str) -> None:
    _installed_modules.add(name)


def mark_uninstalled(name: str) -> None:
    _installed_modules.discard(name)


def get_installed_modules() -> set[str]:
    return set(_installed_modules)


# ── Module discovery & loading ────────────────────────────────────────────────

def scan_all_modules() -> list[str]:
    """Return names of all modules that have a manifest.py."""
    names = []
    for module_dir in sorted(_MODULES_DIR.iterdir()):
        if not module_dir.is_dir() or module_dir.name.startswith("_"):
            continue
        if (module_dir / "manifest.py").exists():
            names.append(module_dir.name)
    return names


def load_modules(app: FastAPI) -> None:
    """
    Dynamically import and register routers for ALL discovered modules.

    All routes are registered at startup. The module_gate middleware (main.py)
    blocks requests to modules that are not installed in the DB.
    """
    all_modules = scan_all_modules()
    logger.info(f"Loading all modules: {all_modules}")

    for module_name in all_modules:
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
