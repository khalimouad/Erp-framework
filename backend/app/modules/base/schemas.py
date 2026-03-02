from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── IrModule ──────────────────────────────────────────────────────────────────

class ModuleOut(BaseModel):
    id: int
    name: str
    label: str
    description: Optional[str]
    version: str
    category: str
    state: str
    depends: list[str]
    auto_install: bool
    installed_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ── IrConfig ──────────────────────────────────────────────────────────────────

class ConfigOut(BaseModel):
    id: int
    key: str
    value: Optional[str]
    description: Optional[str]
    group: str
    value_type: str

    model_config = {"from_attributes": True}


class ConfigUpdate(BaseModel):
    value: Optional[str] = None


class ConfigCreate(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    group: str = "general"
    value_type: str = "string"


# ── IrSequence ────────────────────────────────────────────────────────────────

class SequenceOut(BaseModel):
    id: int
    code: str
    prefix: str
    padding: int
    next_number: int

    model_config = {"from_attributes": True}
