import pytest
from pydantic import ValidationError
from backend.utils.schemas import EventPlanResponse
from backend.services.gemini_service import generate_mock_event_plan

def test_mock_plan_conforms_to_schema(sample_wedding_intake):
    """Ensure mock generated event plan conforms strictly to the EventPlanResponse Pydantic schema."""
    plan_dict = generate_mock_event_plan(sample_wedding_intake)
    validated = EventPlanResponse.model_validate(plan_dict)

    assert validated.summary != ""
    assert validated.estimated_cost_per_head > 0
    assert len(validated.budget_breakdown) >= 6
    assert len(validated.timeline) >= 8
    assert len(validated.vendor_checklist) >= 6
    assert len(validated.personalized_ideas.themes) >= 2
    assert len(validated.personalized_ideas.color_palettes) >= 2
    assert len(validated.personalized_ideas.menu_ideas) >= 4

def test_incomplete_json_raises_validation_error():
    """Ensure missing required sections in LLM output trigger validation errors."""
    incomplete_data = {
        "summary": "Sample plan",
        "estimated_cost_per_head": 2500.0,
        # Missing budget_breakdown, timeline, vendor_checklist, personalized_ideas
    }
    with pytest.raises(ValidationError):
        EventPlanResponse.model_validate(incomplete_data)

def test_invalid_category_amount_type():
    """Ensure non-numeric budget amounts trigger schema validation errors."""
    malformed_data = {
        "summary": "Sample plan",
        "estimated_cost_per_head": 2500.0,
        "budget_breakdown": [
            {"id": "b-1", "category": "Venue", "amount": "invalid_not_a_number", "percentage": 25.0}
        ],
        "timeline": [],
        "vendor_checklist": [],
        "personalized_ideas": {"themes": [], "color_palettes": [], "menu_ideas": [], "activities": []}
    }
    with pytest.raises(ValidationError):
        EventPlanResponse.model_validate(malformed_data)

def test_negative_category_amount_rejected():
    """Ensure negative amounts in budget line items are rejected by schema."""
    malformed_data = {
        "summary": "Sample plan",
        "estimated_cost_per_head": 2500.0,
        "budget_breakdown": [
            {"id": "b-1", "category": "Venue", "amount": -500.0, "percentage": 25.0}
        ],
        "timeline": [],
        "vendor_checklist": [],
        "personalized_ideas": {"themes": [], "color_palettes": [], "menu_ideas": [], "activities": []}
    }
    with pytest.raises(ValidationError):
        EventPlanResponse.model_validate(malformed_data)

def test_extract_json_from_markdown_fences():
    """Ensure markdown ```json code blocks are cleanly extracted and parsed."""
    from backend.services.gemini_service import extract_and_parse_json
    raw_response = "```json\n{\"test_key\": \"test_val\", \"number\": 42}\n```"
    parsed = extract_and_parse_json(raw_response)
    assert parsed["test_key"] == "test_val"
    assert parsed["number"] == 42

def test_normalize_camel_case_keys():
    """Ensure camelCase keys from LLM responses are normalized to snake_case."""
    from backend.services.gemini_service import normalize_plan_keys
    camel_data = {
        "budgetBreakdown": [{"id": "1", "actualSpend": 500}],
        "vendorChecklist": [{"id": "2", "estimatedCost": 1000}],
        "timeline": [{"id": "3", "dueDate": "2027-01-01"}],
        "personalizedIdeas": {"colorPalettes": []}
    }
    normalized = normalize_plan_keys(camel_data)
    assert "budget_breakdown" in normalized
    assert normalized["budget_breakdown"][0]["actual_spend"] == 500
    assert "vendor_checklist" in normalized
    assert normalized["vendor_checklist"][0]["estimated_cost"] == 1000
    assert normalized["timeline"][0]["due_date"] == "2027-01-01"
    assert "color_palettes" in normalized["personalized_ideas"]

