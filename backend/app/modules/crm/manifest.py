MANIFEST = {
    "name": "crm",
    "label": "CRM",
    "version": "1.0",
    "category": "Sales",
    "description": "Manage your sales pipeline: leads, opportunities, and activities.",
    "depends": ["base", "users", "companies"],
    "auto_install": False,
    "roles": [
        {
            "name": "crm.manager",
            "label": "CRM Manager",
            "description": "Full access to leads, pipeline, and CRM activities",
            "permissions": [
                {"resource": "crm.lead",     "read": True, "write": True, "create": True, "delete": True},
                {"resource": "crm.activity", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "crm.user",
            "label": "Sales User",
            "description": "Create and manage leads; cannot delete",
            "permissions": [
                {"resource": "crm.lead",     "read": True, "write": True, "create": True, "delete": False},
                {"resource": "crm.activity", "read": True, "write": True, "create": True, "delete": False},
            ],
        },
        {
            "name": "crm.readonly",
            "label": "CRM Viewer",
            "description": "View pipeline and leads only",
            "permissions": [
                {"resource": "crm.lead",     "read": True, "write": False, "create": False, "delete": False},
                {"resource": "crm.activity", "read": True, "write": False, "create": False, "delete": False},
            ],
        },
    ],
}
