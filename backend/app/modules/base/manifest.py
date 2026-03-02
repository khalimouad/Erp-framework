MANIFEST = {
    "name": "base",
    "label": "Base Framework",
    "version": "1.0",
    "category": "Core",
    "description": (
        "Foundation module installed automatically on first boot. "
        "Provides the module registry, system configuration store, "
        "sequence generator, and role/permission system."
    ),
    "depends": [],
    "auto_install": True,
    "roles": [
        {
            "name": "base.admin",
            "label": "System Administrator",
            "description": "Manage modules, configuration, sequences, and all roles",
            "permissions": [
                {"resource": "base.module",   "read": True, "write": True, "create": True, "delete": True},
                {"resource": "base.config",   "read": True, "write": True, "create": True, "delete": True},
                {"resource": "base.role",     "read": True, "write": True, "create": True, "delete": True},
            ],
        },
    ],
}
