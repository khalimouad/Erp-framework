MANIFEST = {
    "name": "sales",
    "label": "Sales",
    "version": "1.0",
    "category": "Sales",
    "description": "Sales orders, quotations, and order lines with auto-reference numbers.",
    "depends": ["base", "crm", "inventory"],
    "auto_install": False,
    "roles": [
        {
            "name": "sales.manager",
            "label": "Sales Manager",
            "description": "Full access to all sales orders including deletion",
            "permissions": [
                {"resource": "sales.order", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "sales.user",
            "label": "Sales User",
            "description": "Create and confirm sales orders; cannot delete",
            "permissions": [
                {"resource": "sales.order", "read": True, "write": True, "create": True, "delete": False},
            ],
        },
        {
            "name": "sales.readonly",
            "label": "Sales Viewer",
            "description": "View sales orders only",
            "permissions": [
                {"resource": "sales.order", "read": True, "write": False, "create": False, "delete": False},
            ],
        },
    ],
}
