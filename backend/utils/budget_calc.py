import math
from typing import List, Dict, Any, Tuple

# Baseline percentage breakdowns for each event type (totaling 100%)
EVENT_BUDGET_TEMPLATES = {
    "Wedding": [
        {"category": "Venue & Infrastructure", "percentage": 25.0, "notes": "Banquet hall/lawn, basic lighting & setup"},
        {"category": "Catering & Bar", "percentage": 30.0, "notes": "Multi-course buffet, live counters & welcome drinks"},
        {"category": "Decor, Florals & Mandap", "percentage": 15.0, "notes": "Entry arches, stage backdrop, floral centerpieces"},
        {"category": "Photography & Cinematic Video", "percentage": 10.0, "notes": "Candid photos, drone footage & teaser reel"},
        {"category": "Music, DJ & Entertainment", "percentage": 7.0, "notes": "Sound system, live musicians/DJ, lighting console"},
        {"category": "Attire, Styling & Hair/Makeup", "percentage": 5.0, "notes": "Bridal/groom styling, makeup artist trials"},
        {"category": "Logistics & Guest Shuttles", "percentage": 4.0, "notes": "Local transport, luggage coordination & valet"},
        {"category": "Contingency Fund", "percentage": 4.0, "notes": "Reserve for unforeseen changes and emergencies"},
    ],
    "Birthday": [
        {"category": "Venue & Private Space", "percentage": 22.0, "notes": "Rooftop lounge, banquet hall, or private garden"},
        {"category": "Food, Drinks & Specialty Cake", "percentage": 32.0, "notes": "Finger foods, signature cocktails, custom 3D cake"},
        {"category": "Themed Decor & Balloon Art", "percentage": 18.0, "notes": "Balloon arches, photo booth backdrop, props"},
        {"category": "DJ, Sound & Host / Emcee", "percentage": 12.0, "notes": "Host for interactive games, curated dance playlist"},
        {"category": "Photography & Photobooth", "percentage": 8.0, "notes": "Instant polaroids, candid shots, digital album"},
        {"category": "Favors & Return Gifts", "percentage": 5.0, "notes": "Curated gift hampers for all guests"},
        {"category": "Contingency Fund", "percentage": 3.0, "notes": "Emergency pool for unexpected attendees"},
    ],
    "Community Event": [
        {"category": "Venue & Permits", "percentage": 20.0, "notes": "Community center/park grounds, municipal clearances"},
        {"category": "Community Feast / Food Stalls", "percentage": 30.0, "notes": "Wholesome food service or vendor stall subsidies"},
        {"category": "AV, Stage, & Power Supply", "percentage": 18.0, "notes": "PA system, stage, microphones, backup generators"},
        {"category": "Decor, Banners & Wayfinding", "percentage": 10.0, "notes": "Welcome signage, informational maps, eco-decor"},
        {"category": "Live Performers & Activities", "percentage": 10.0, "notes": "Cultural dances, kids' art zone, speaker honorariums"},
        {"category": "Security, First Aid & Sanitation", "percentage": 7.0, "notes": "Paramedic booth, waste sorting, volunteer marshals"},
        {"category": "Contingency Fund", "percentage": 5.0, "notes": "Weather backup and reserve supplies"},
    ],
    "College Event": [
        {"category": "Auditorium & Campus Venue", "percentage": 18.0, "notes": "Auditorium staging, open amphitheater, campus security permissions"},
        {"category": "Sound, Lighting & DJ / Band", "percentage": 24.0, "notes": "Concert PA line array, intelligent stage lighting, artist riders"},
        {"category": "Artist / Celebrity / Keynote", "percentage": 20.0, "notes": "Guest performer honorarium, travel, and backstage hospitality"},
        {"category": "Food Trucks & Refreshments", "percentage": 18.0, "notes": "Campus snack stalls, hydration stations, volunteer meals"},
        {"category": "PR, Merch, Banners & Stage", "percentage": 10.0, "notes": "Stage backdrop, festival wristbands, identity cards, posters"},
        {"category": "Prizes, Trophies & Competitions", "percentage": 5.0, "notes": "Trophies, certificates, hackathon / cultural cash prizes"},
        {"category": "Contingency Fund", "percentage": 5.0, "notes": "Emergency equipment backup & volunteer marshals"},
    ],
    "Custom Event": [
        {"category": "Primary Space & Venue", "percentage": 25.0, "notes": "Custom private hall, outdoor lawn, or dedicated pavilion"},
        {"category": "Food, Beverage & Hospitality", "percentage": 28.0, "notes": "Catered meals, live cooking bars, dessert counters"},
        {"category": "Themed Scenography & Decor", "percentage": 16.0, "notes": "Bespoke styling, entryway arches, custom lighting"},
        {"category": "Audio-Visual & Entertainment", "percentage": 14.0, "notes": "Integrated acoustics, screens, background music / performers"},
        {"category": "Photography, Media & Branding", "percentage": 9.0, "notes": "Event photographer, short-form reels, commemorative prints"},
        {"category": "Staffing, Permits & Logistics", "percentage": 4.0, "notes": "Event coordinators, gate check-in, parking coordination"},
        {"category": "Contingency & Reserves", "percentage": 4.0, "notes": "Buffer for unexpected requests and adjustments"},
    ]
}

def validate_budget_sum(breakdown: List[Dict[str, Any]], total_budget: float, tolerance: float = 1.0) -> Tuple[bool, float, float]:
    """
    Validates whether the sum of line item amounts matches total_budget within tolerance.
    Returns (is_valid, calculated_sum, difference).
    """
    total_amount = sum(float(item.get("amount", 0.0)) for item in breakdown)
    diff = abs(total_amount - total_budget)
    is_valid = diff <= tolerance
    return is_valid, round(total_amount, 2), round(diff, 2)

def calculate_over_budget(breakdown: List[Dict[str, Any]], total_budget: float) -> Tuple[bool, float, float]:
    """
    Checks if allocated items exceed total budget.
    Returns (is_over_budget, excess_amount, total_allocated).
    """
    total_allocated = sum(float(item.get("amount", 0.0)) for item in breakdown)
    is_over = total_allocated > total_budget
    excess = max(0.0, total_allocated - total_budget)
    return is_over, round(excess, 2), round(total_allocated, 2)

def generate_initial_budget(event_type: str, total_budget: float) -> List[Dict[str, Any]]:
    """
    Generates deterministic category breakdown for a given event type and budget.
    Ensures exact 100% allocation and rounded whole numbers.
    """
    template = EVENT_BUDGET_TEMPLATES.get(event_type, EVENT_BUDGET_TEMPLATES["Wedding"])
    breakdown = []
    accumulated_amount = 0.0

    for idx, item in enumerate(template):
        pct = item["percentage"]
        if idx == len(template) - 1:
            # Last item absorbs any rounding difference to ensure sum == total_budget
            allocated = max(0.0, round(total_budget - accumulated_amount, 2))
        else:
            allocated = round((pct / 100.0) * total_budget, 2)
            accumulated_amount += allocated

        calc_pct = round((allocated / total_budget) * 100.0, 1) if total_budget > 0 else 0.0
        breakdown.append({
            "id": f"budget-{idx + 1}",
            "category": item["category"],
            "amount": allocated,
            "percentage": calc_pct,
            "notes": item["notes"],
            "actual_spend": 0.0
        })

    return breakdown

def recalculate_slider_adjustment(
    breakdown: List[Dict[str, Any]],
    changed_category_id: str,
    new_amount: float,
    total_budget: float
) -> List[Dict[str, Any]]:
    """
    Recalculates all budget line items when a user adjusts a single category slider.
    Locks the user's adjusted item and proportionally rebalances the remaining categories
    so the entire budget sums back to total_budget.
    """
    if total_budget <= 0:
        return breakdown

    # Clamp target item amount
    target_amount = max(0.0, min(new_amount, total_budget))
    remaining_budget = total_budget - target_amount

    # Split into target and other items
    other_items = [item for item in breakdown if item.get("id") != changed_category_id]
    current_other_sum = sum(float(i.get("amount", 0.0)) for i in other_items)

    result = []
    running_sum = target_amount

    for idx, item in enumerate(breakdown):
        if item.get("id") == changed_category_id:
            pct = round((target_amount / total_budget) * 100.0, 1)
            result.append({**item, "amount": target_amount, "percentage": pct})
        else:
            # Proportional scale
            if current_other_sum > 0:
                scale_ratio = float(item.get("amount", 0.0)) / current_other_sum
                scaled_amount = round(scale_ratio * remaining_budget, 2)
            else:
                scaled_amount = round(remaining_budget / max(1, len(other_items)), 2)

            running_sum += scaled_amount
            pct = round((scaled_amount / total_budget) * 100.0, 1)
            result.append({**item, "amount": scaled_amount, "percentage": pct})

    # Adjust rounding discrepancy on the last non-target item
    non_target_indexes = [i for i, item in enumerate(result) if item.get("id") != changed_category_id]
    if non_target_indexes:
        last_idx = non_target_indexes[-1]
        sum_now = sum(item["amount"] for item in result)
        diff = total_budget - sum_now
        result[last_idx]["amount"] = round(result[last_idx]["amount"] + diff, 2)
        result[last_idx]["percentage"] = round((result[last_idx]["amount"] / total_budget) * 100.0, 1)

    return result
