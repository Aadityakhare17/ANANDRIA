import pytest
from backend.utils.budget_calc import (
    validate_budget_sum,
    calculate_over_budget,
    generate_initial_budget,
    recalculate_slider_adjustment
)

def test_initial_budget_sum_matches_total():
    """Verify that generated initial budget allocations sum accurately to 100% of the total budget."""
    for event_type in ["Wedding", "Birthday", "Community Event"]:
        total_budget = 750000.0
        breakdown = generate_initial_budget(event_type, total_budget)
        is_valid, calculated_sum, diff = validate_budget_sum(breakdown, total_budget)

        assert is_valid, f"{event_type} budget sum {calculated_sum} differed from {total_budget} by {diff}"
        assert diff <= 1.0, f"Difference {diff} exceeds 1.0 unit threshold"

def test_over_budget_detection():
    """Test over-budget calculation when amounts exceed the total budget."""
    total_budget = 100000.0
    items = [
        {"id": "b-1", "amount": 60000.0},
        {"id": "b-2", "amount": 55000.0} # Total: 115,000 (+15,000)
    ]
    is_over, excess, allocated = calculate_over_budget(items, total_budget)
    assert is_over is True
    assert excess == 15000.0
    assert allocated == 115000.0

def test_under_budget_not_flagged_as_over():
    """Test that under-budget allocation does not trigger an over-budget alert."""
    total_budget = 100000.0
    items = [
        {"id": "b-1", "amount": 40000.0},
        {"id": "b-2", "amount": 30000.0}
    ]
    is_over, excess, allocated = calculate_over_budget(items, total_budget)
    assert is_over is False
    assert excess == 0.0
    assert allocated == 70000.0

def test_slider_adjustment_preserves_total_sum():
    """Verify that adjusting one budget item slider rebalances other categories so sum remains 100%."""
    total_budget = 500000.0
    breakdown = generate_initial_budget("Wedding", total_budget)

    # Adjust the first category ('Venue & Infrastructure') to 200,000 (was ~125,000)
    adjusted = recalculate_slider_adjustment(
        breakdown=breakdown,
        changed_category_id="budget-1",
        new_amount=200000.0,
        total_budget=total_budget
    )

    venue_item = next(item for item in adjusted if item["id"] == "budget-1")
    assert venue_item["amount"] == 200000.0

    # Ensure total sum still matches total_budget
    is_valid, calculated_sum, diff = validate_budget_sum(adjusted, total_budget)
    assert is_valid, f"Adjusted budget total {calculated_sum} differs from {total_budget}"
    assert diff <= 1.0
