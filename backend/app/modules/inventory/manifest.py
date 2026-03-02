MANIFEST = {
    "name": "inventory",
    "label": "Inventory",
    "version": "1.0",
    "category": "Operations",
    "description": "Products, warehouses, stock moves, and real-time stock levels.",
    "depends": ["base", "companies"],
    "auto_install": False,
    "roles": [
        {
            "name": "inventory.manager",
            "label": "Inventory Manager",
            "description": "Full access to products, warehouses, and stock moves",
            "permissions": [
                {"resource": "inventory.product",   "read": True, "write": True, "create": True, "delete": True},
                {"resource": "inventory.warehouse",  "read": True, "write": True, "create": True, "delete": True},
                {"resource": "inventory.stock_move", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "inventory.user",
            "label": "Stock Operator",
            "description": "Record stock moves and update products; cannot delete",
            "permissions": [
                {"resource": "inventory.product",   "read": True, "write": True, "create": True,  "delete": False},
                {"resource": "inventory.warehouse",  "read": True, "write": False, "create": False, "delete": False},
                {"resource": "inventory.stock_move", "read": True, "write": True, "create": True,  "delete": False},
            ],
        },
        {
            "name": "inventory.readonly",
            "label": "Inventory Viewer",
            "description": "View products and stock levels only",
            "permissions": [
                {"resource": "inventory.product",   "read": True, "write": False, "create": False, "delete": False},
                {"resource": "inventory.warehouse",  "read": True, "write": False, "create": False, "delete": False},
                {"resource": "inventory.stock_move", "read": True, "write": False, "create": False, "delete": False},
            ],
        },
    ],
}
