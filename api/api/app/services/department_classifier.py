KEYWORDS = {
    "Water": ["water", "tap", "pipe", "leak"],
    "Electrical": ["light", "fan", "switch", "wire"],
    "Network": ["wifi", "internet", "network"],
    "Hostel": ["hostel", "room", "washroom", "clean"],
}


def predict_department(text: str) -> str:
    t = text.lower()

    for department, words in KEYWORDS.items():
        if any(word in t for word in words):
            return department

    return "General"