MANIFEST = {
    "name": "users",
    "label": "Users & Roles",
    "version": "1.0",
    "category": "Core",
    "description": "User accounts, roles, JWT authentication, and access control.",
    "depends": ["base"],
    "auto_install": True,
    "roles": [
        {
            "name": "users.manager",
            "label": "User Manager",
            "description": "Create and edit users; assign and revoke roles",
            "permissions": [
                {"resource": "users.user", "read": True, "write": True, "create": True, "delete": False},
                {"resource": "users.role", "read": True, "write": True, "create": False, "delete": False},
            ],
        },
        {
            "name": "users.readonly",
            "label": "User Viewer",
            "description": "View users and their assigned roles (no edits)",
            "permissions": [
                {"resource": "users.user", "read": True, "write": False, "create": False, "delete": False},
            ],
        },
    ],
}
