MANIFEST = {
    "name": "medical",
    "label": "Medical / Clinic",
    "version": "1.0",
    "category": "Medical",
    "description": "Patients, appointments, medical records, prescriptions, and pharmacy.",
    "depends": ["base", "hr"],
    "auto_install": False,
    "roles": [
        {
            "name": "medical.doctor",
            "label": "Doctor / Physician",
            "description": "Full access to patients, records, appointments, and prescriptions",
            "permissions": [
                {"resource": "medical.patient",      "read": True, "write": True, "create": True, "delete": True},
                {"resource": "medical.appointment",  "read": True, "write": True, "create": True, "delete": True},
                {"resource": "medical.record",       "read": True, "write": True, "create": True, "delete": True},
                {"resource": "medical.prescription", "read": True, "write": True, "create": True, "delete": True},
                {"resource": "medical.pharmacy",     "read": True, "write": False, "create": False, "delete": False},
            ],
        },
        {
            "name": "medical.receptionist",
            "label": "Receptionist",
            "description": "Manage patients and appointments; no access to medical records",
            "permissions": [
                {"resource": "medical.patient",     "read": True, "write": True,  "create": True,  "delete": False},
                {"resource": "medical.appointment", "read": True, "write": True,  "create": True,  "delete": False},
                {"resource": "medical.record",      "read": False, "write": False, "create": False, "delete": False},
            ],
        },
        {
            "name": "medical.pharmacist",
            "label": "Pharmacist",
            "description": "Manage pharmacy stock and view prescriptions",
            "permissions": [
                {"resource": "medical.pharmacy",     "read": True, "write": True, "create": True, "delete": False},
                {"resource": "medical.prescription", "read": True, "write": False, "create": False, "delete": False},
            ],
        },
    ],
}
