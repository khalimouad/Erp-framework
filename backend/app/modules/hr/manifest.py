MANIFEST = {
    "name": "hr",
    "label": "Human Resources",
    "version": "1.0",
    "category": "HR",
    "description": "Employees, departments, contracts, and leave management.",
    "depends": ["base", "companies"],
    "auto_install": False,
    "roles": [
        {
            "name": "hr.manager",
            "label": "HR Manager",
            "description": "Manage employees, departments, and approve leave requests",
            "permissions": [
                {"resource": "hr.employee",   "read": True, "write": True, "create": True, "delete": True},
                {"resource": "hr.department", "read": True, "write": True, "create": True, "delete": True},
                {"resource": "hr.leave",      "read": True, "write": True, "create": True, "delete": True},
            ],
        },
        {
            "name": "hr.officer",
            "label": "HR Officer",
            "description": "Manage employee records and process leave requests",
            "permissions": [
                {"resource": "hr.employee",   "read": True, "write": True, "create": True,  "delete": False},
                {"resource": "hr.department", "read": True, "write": False, "create": False, "delete": False},
                {"resource": "hr.leave",      "read": True, "write": True, "create": True,  "delete": False},
            ],
        },
        {
            "name": "hr.employee",
            "label": "Employee",
            "description": "View org chart and submit own leave requests",
            "permissions": [
                {"resource": "hr.employee",   "read": True, "write": False, "create": False, "delete": False},
                {"resource": "hr.department", "read": True, "write": False, "create": False, "delete": False},
                {"resource": "hr.leave",      "read": True, "write": False, "create": True,  "delete": False},
            ],
        },
    ],
}
