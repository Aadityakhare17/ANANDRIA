from backend.utils.budget_calc import (
    validate_budget_sum,
    calculate_over_budget,
    generate_initial_budget,
    recalculate_slider_adjustment
)

def test_initial_budget_sum_matches_total():
    """Verify that generated initial budget allocations sum accurately to 100% of the total budget."""
    for event_type in ["Wedding", "Birthday", "Community Event", "College Event", "Custom Event"]:
        total_budget = 750000.0
        breakdown = generate_initial_budget(event_type, total_budget)
        is_valid, calculated_sum, diff = validate_budget_sum(breakdown, total_budget)

        assert is_valid, f"{event_type} budget sum {calculated_sum} differed from {total_budget} by {diff}"
        assert diff <= 1.0, f"Difference {diff} exceeds 1.0 unit threshold"

def test_college_and_custom_event_allocations():
    """Verify category proportions for College and Custom Events."""
    college_breakdown = generate_initial_budget("College Event", 100000.0)
    cats = {item["category"]: item["amount"] for item in college_breakdown}
    assert "Sound, Lighting & DJ / Band" in cats
    assert len(college_breakdown) >= 6

    custom_breakdown = generate_initial_budget("Custom Event", 200000.0)
    assert len(custom_breakdown) >= 6
    is_valid, total, _ = validate_budget_sum(custom_breakdown, 200000.0)
    assert is_valid

def test_extreme_budget_boundaries():
    """Verify mathematical determinism across extreme budget scales ($100 to $100,000,000)."""
    for extreme_total in [100.0, 5000.0, 100000000.0]:
        breakdown = generate_initial_budget("Wedding", extreme_total)
        is_valid, calc_sum, diff = validate_budget_sum(breakdown, extreme_total)
        assert is_valid
        assert diff <= 1.0

def test_slider_adjustment_to_zero_and_max():
    """Verify slider rebalancing behavior when dragged to 0 or 100% total budget."""
    total_budget = 500000.0
    breakdown = generate_initial_budget("Wedding", total_budget)

    # Set to 0
    adj_zero = recalculate_slider_adjustment(breakdown, "budget-1", 0.0, total_budget)
    is_valid_zero, sum_zero, diff_zero = validate_budget_sum(adj_zero, total_budget)
    assert is_valid_zero
    assert diff_zero <= 1.0

    # Set to max
    adj_max = recalculate_slider_adjustment(breakdown, "budget-1", total_budget, total_budget)
    is_valid_max, sum_max, diff_max = validate_budget_sum(adj_max, total_budget)
    assert is_valid_max
    assert diff_max <= 1.0

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
