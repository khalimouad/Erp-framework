MANIFEST = {
    "name": "purchasing",
    "label": "Purchasing",
    "version": "1.0",
    "category": "Operations",
    "description": "Purchase orders, vendor management, and goods receipt.",
    "depends": ["base", "inventory"],
    "auto_install": False,
    "roles": [
        {
            "name": "purchasing.manager",
            "label": "Purchase Manager",
            "description": "Full access to all purchase orders",
            "permissions": [
                {"resource": "purchasing.order", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "purchasing.user",
            "label": "Purchase User",
            "description": "Create and submit purchase orders; cannot delete",
            "permissions": [
                {"resource": "purchasing.order", "read": True, "write": True, "create": True, "delete": False},
            ],
        },
    ],
}
