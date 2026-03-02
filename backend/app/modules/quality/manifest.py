MANIFEST = {
    "name": "quality",
    "label": "Quality Control",
    "version": "1.0",
    "category": "Operations",
    "description": "Quality checks, pass/fail results, and inspection workflows.",
    "depends": ["base", "manufacturing", "inventory"],
    "auto_install": False,
    "roles": [
        {
            "name": "quality.manager",
            "label": "Quality Manager",
            "description": "Define quality checks, review all results, and manage standards",
            "permissions": [
                {"resource": "quality.check", "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "quality.inspector",
            "label": "Quality Inspector",
            "description": "Record inspection results on assigned quality checks",
            "permissions": [
                {"resource": "quality.check", "read": True, "write": True, "create": False, "delete": False},
            ],
        },
    ],
}
