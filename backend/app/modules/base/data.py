"""
Default seed data for the base module.

Seeded once at first boot; existing rows are never overwritten.
"""

DEFAULT_CONFIGS: list[dict] = [
    # ── General ──────────────────────────────────────────────
    {
        "key": "app.name",
        "value": "NextERP",
        "group": "general",
        "description": "Application display name",
        "value_type": "string",
    },
    {
        "key": "app.company_name",
        "value": "My Company",
        "group": "general",
        "description": "Default company name shown on documents",
        "value_type": "string",
    },
    {
        "key": "app.currency",
        "value": "USD",
        "group": "general",
        "description": "Default currency code (ISO 4217)",
        "value_type": "string",
    },
    {
        "key": "app.timezone",
        "value": "UTC",
        "group": "general",
        "description": "Server timezone (e.g. America/New_York)",
        "value_type": "string",
    },
    {
        "key": "app.language",
        "value": "en",
        "group": "general",
        "description": "Default UI language code",
        "value_type": "string",
    },
    # ── Security ─────────────────────────────────────────────
    {
        "key": "security.password_min_length",
        "value": "8",
        "group": "security",
        "description": "Minimum password length for new users",
        "value_type": "integer",
    },
    {
        "key": "security.session_timeout_hours",
        "value": "24",
        "group": "security",
        "description": "JWT token lifetime in hours",
        "value_type": "integer",
    },
    {
        "key": "security.allow_registration",
        "value": "false",
        "group": "security",
        "description": "Allow public user self-registration",
        "value_type": "boolean",
    },
    # ── Mail ─────────────────────────────────────────────────
    {
        "key": "mail.from_name",
        "value": "NextERP",
        "group": "mail",
        "description": "Email sender display name",
        "value_type": "string",
    },
    {
        "key": "mail.from_email",
        "value": "noreply@nexterp.com",
        "group": "mail",
        "description": "Email sender address",
        "value_type": "string",
    },
    {
        "key": "mail.smtp_host",
        "value": "",
        "group": "mail",
        "description": "SMTP server hostname",
        "value_type": "string",
    },
    {
        "key": "mail.smtp_port",
        "value": "587",
        "group": "mail",
        "description": "SMTP server port",
        "value_type": "integer",
    },
]

DEFAULT_SEQUENCES: list[dict] = [
    {"code": "sale.order",      "prefix": "SO-",  "padding": 5, "next_number": 1},
    {"code": "purchase.order",  "prefix": "PO-",  "padding": 5, "next_number": 1},
    {"code": "invoice",         "prefix": "INV-", "padding": 5, "next_number": 1},
    {"code": "patient",         "prefix": "PAT-", "padding": 5, "next_number": 1},
    {"code": "work.order",      "prefix": "WO-",  "padding": 5, "next_number": 1},
    {"code": "quality.check",   "prefix": "QC-",  "padding": 5, "next_number": 1},
    {"code": "hr.employee",     "prefix": "EMP-", "padding": 5, "next_number": 1},
]
