MANIFEST = {
    "name": "accounting",
    "label": "Accounting",
    "version": "1.0",
    "category": "Finance",
    "description": "Invoices, payments, and automatic status tracking.",
    "depends": ["base", "companies"],
    "auto_install": False,
    "roles": [
        {
            "name": "accounting.manager",
            "label": "Accounting Manager",
            "description": "Create invoices, record payments, and manage financial records",
            "permissions": [
                {"resource": "accounting.invoice", "read": True, "write": True, "create": True, "delete": True},
                {"resource": "accounting.payment", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "accounting.user",
            "label": "Accountant",
            "description": "Create invoices and record payments; cannot delete",
            "permissions": [
                {"resource": "accounting.invoice", "read": True, "write": True, "create": True,  "delete": False},
                {"resource": "accounting.payment", "read": True, "write": True, "create": True,  "delete": False},
            ],
        },
        {
            "name": "accounting.readonly",
            "label": "Finance Viewer",
            "description": "View invoices and payment status only",
            "permissions": [
                {"resource": "accounting.invoice", "read": True, "write": False, "create": False, "delete": False},
                {"resource": "accounting.payment", "read": True, "write": False, "create": False, "delete": False},
            ],
        },
    ],
}
