SIGNALS = {
    "safety_risk":     {"weight": 30, "description": "Safety or immediate-risk language detected"},
    "urgency":         {"weight": 25, "description": "Time-sensitive or urgent language"},
    "affected_users":  {"weight": 20, "description": "Number of affected students"},
    "sla_risk":        {"weight": 15, "description": "SLA deadline proximity"},
    "recurrence":      {"weight": 10, "description": "Number of similar prior complaints"},
}

THRESHOLDS = {
    "normal":   (0, 29),
    "high":     (30, 59),
    "urgent":   (60, 79),
}
