MANIFEST = {
    "name": "manufacturing",
    "label": "Manufacturing",
    "version": "1.0",
    "category": "Operations",
    "description": "Bills of materials, work orders, and production tracking.",
    "depends": ["base", "inventory"],
    "auto_install": False,
    "roles": [
        {
            "name": "manufacturing.manager",
            "label": "Production Manager",
            "description": "Manage BOMs, plan and schedule work orders",
            "permissions": [
                {"resource": "manufacturing.bom",        "read": True, "write": True, "create": True, "delete": True},
                {"resource": "manufacturing.work_order", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "manufacturing.operator",
            "label": "Production Operator",
            "description": "View BOMs and update progress on assigned work orders",
            "permissions": [
                {"resource": "manufacturing.bom",        "read": True, "write": False, "create": False, "delete": False},
                {"resource": "manufacturing.work_order", "read": True, "write": True,  "create": False, "delete": False},
            ],
        },
    ],
}
