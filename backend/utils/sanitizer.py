import re
from datetime import datetime, date
from typing import Tuple, Dict, Any
import bleach

# Signatures indicating malicious prompt injection attempts to override system role or output schema
INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions",
    r"disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions",
    r"you\s+are\s+now\s+(?:an?\s+)?(?:unrestricted|jailbreak|dan|evil)",
    r"bypass\s+(?:content|safety|system)\s+filters?",
    r"forget\s+(?:all\s+)?your\s+(?:instructions|guidelines|rules|persona)",
    r"<\|system\|>",
    r"<\|im_start\|>",
    r"\[INST\]",
    r"system\s*:\s*you\s+are",
    r"system\s+prompt\s+override",
    r"reveal\s+(?:your\s+)?(?:system\s+prompt|hidden\s+instructions|api\s+key)",
]

COMPILED_INJECTIONS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

def sanitize_text(text: str) -> str:
    """
    Sanitize text input to eliminate XSS markup and script injection.
    Strips all HTML tags and control characters.
    """
    if not isinstance(text, str):
        return ""
    # Strip all HTML tags
    cleaned = bleach.clean(text, tags=[], strip=True)
    # Remove control characters except standard whitespace
    cleaned = "".join(ch for ch in cleaned if ch.isprintable() or ch in ("\n", "\r", "\t"))
    return cleaned.strip()

def detect_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Scans a string for prompt injection attempts.
    Returns (True, pattern_matched) if suspicious, else (False, "").
    """
    if not text:
        return False, ""
    for pattern in COMPILED_INJECTIONS:
        if pattern.search(text):
            return True, pattern.pattern
    return False, ""

def validate_future_date(date_str: str) -> Tuple[bool, str]:
    """
    Validates that a date string is in YYYY-MM-DD format and strictly in the future.
    """
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = date.today()
        if parsed_date <= today:
            return False, "Target date must be in the future (strictly after today)."
        return True, ""
    except ValueError:
        return False, "Target date must be a valid date formatted as YYYY-MM-DD."

def validate_and_sanitize_intake(data: Dict[str, Any]) -> Tuple[bool, Dict[str, str], Dict[str, Any]]:
    """
    Validates intake data and returns (is_valid, errors_dict, sanitized_data).
    """
    errors = {}
    sanitized = {}

    # Event Type
    event_type = data.get("event_type", "").strip()
    valid_types = ["Wedding", "Birthday", "Community Event", "College Event", "Custom Event"]
    if event_type not in valid_types:
        errors["event_type"] = f"Event type must be one of: {', '.join(valid_types)}."
    else:
        sanitized["event_type"] = event_type

    # Event Name
    raw_name = data.get("event_name", "")
    clean_name = sanitize_text(raw_name)
    if not clean_name:
        errors["event_name"] = "Event name cannot be empty."
    elif len(clean_name) < 2:
        errors["event_name"] = "Event name must be at least 2 characters."
    elif len(clean_name) > 120:
        errors["event_name"] = "Event name cannot exceed 120 characters."
    else:
        sanitized["event_name"] = clean_name

    # Target Date
    target_date = data.get("target_date", "").strip()
    date_ok, date_err = validate_future_date(target_date)
    if not date_ok:
        errors["target_date"] = date_err
    else:
        sanitized["target_date"] = target_date

    # Guest Count
    try:
        guests = int(data.get("guest_count", 0))
        if guests <= 0:
            errors["guest_count"] = "Guest count must be greater than zero."
        elif guests > 50000:
            errors["guest_count"] = "Guest count cannot exceed 50,000."
        else:
            sanitized["guest_count"] = guests
    except (ValueError, TypeError):
        errors["guest_count"] = "Guest count must be a valid positive integer."

    # Total Budget
    try:
        budget = float(data.get("total_budget", 0))
        if budget <= 0:
            errors["total_budget"] = "Total budget must be a positive number greater than 0."
        elif budget > 1_000_000_000:
            errors["total_budget"] = "Budget exceeds maximum threshold (1,000,000,000)."
        else:
            sanitized["total_budget"] = budget
    except (ValueError, TypeError):
        errors["total_budget"] = "Total budget must be a valid positive number."

    # Currency
    curr = data.get("currency", "INR").strip().upper()
    if curr not in ["INR", "USD", "EUR", "GBP"]:
        sanitized["currency"] = "INR"
    else:
        sanitized["currency"] = curr

    # Location & Cultural Style
    raw_loc = data.get("location", "")
    sanitized["location"] = sanitize_text(raw_loc)[:150]

    # Theme Keywords
    raw_theme = data.get("theme_keywords", "")
    clean_theme = sanitize_text(raw_theme)[:300]
    inj_theme, _ = detect_prompt_injection(clean_theme)
    if inj_theme:
        errors["theme_keywords"] = "Security alert: Unsafe or prohibited instruction syntax detected."
    else:
        sanitized["theme_keywords"] = clean_theme

    # Special Requirements
    raw_req = data.get("special_requirements", "")
    clean_req = sanitize_text(raw_req)[:800]
    inj_req, _ = detect_prompt_injection(clean_req)
    if inj_req:
        errors["special_requirements"] = "Security alert: Unsafe or prohibited instruction syntax detected."
    else:
        sanitized["special_requirements"] = clean_req

    is_valid = len(errors) == 0
    return is_valid, errors, sanitized
