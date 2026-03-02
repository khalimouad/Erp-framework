MANIFEST = {
    "name": "companies",
    "label": "Companies",
    "version": "1.0",
    "category": "Core",
    "description": "Multi-company support: manage legal entities, currencies and branches.",
    "depends": ["base"],
    "auto_install": True,
    "roles": [
        {
            "name": "companies.manager",
            "label": "Company Manager",
            "description": "Create and configure companies and branches",
            "permissions": [
                {"resource": "companies.company", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
    ],
}
