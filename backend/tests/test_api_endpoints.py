import pytest
import time
from backend import config

def test_health_check_endpoint(client):
    """Test the health check endpoint returns 200 with operational mode."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "ANANDRIA"
    assert "operational_mode" in data

def test_generate_plan_endpoint(client, sample_wedding_intake):
    """Test generating a plan through the API endpoint."""
    # Ensure cooldown has elapsed
    time.sleep(config.RATE_LIMIT_COOLDOWN_SECONDS + 0.1)

    response = client.post("/api/plan/generate", json=sample_wedding_intake)
    assert response.status_code == 200
    data = response.json()
    assert "budget_breakdown" in data
    assert "timeline" in data
    assert "vendor_checklist" in data
    assert "personalized_ideas" in data
    assert len(data["budget_breakdown"]) > 0

def test_refine_plan_endpoint(client, sample_wedding_intake):
    """Test refining an event plan through the API endpoint."""
    time.sleep(config.RATE_LIMIT_COOLDOWN_SECONDS + 0.1)
    gen_response = client.post("/api/plan/generate", json=sample_wedding_intake)
    assert gen_response.status_code == 200
    current_plan = gen_response.json()

    time.sleep(config.RATE_LIMIT_COOLDOWN_SECONDS + 0.1)
    refine_payload = {
        "refinement_prompt": "Make it eco-friendly and reduce budget by 15%",
        "current_plan": current_plan,
        "event_details": sample_wedding_intake
    }
    refine_resp = client.post("/api/plan/refine", json=refine_payload)
    assert refine_resp.status_code == 200
    refined_data = refine_resp.json()
    assert "budget_breakdown" in refined_data

def test_rate_limiting_enforcement(client, sample_wedding_intake):
    """Verify that rapid successive plan generation requests are rate-limited with HTTP 429."""
    time.sleep(config.RATE_LIMIT_COOLDOWN_SECONDS + 0.1)
    # First call succeeds
    resp1 = client.post("/api/plan/generate", json=sample_wedding_intake)
    assert resp1.status_code == 200

    # Immediate second call without waiting must return HTTP 429
    resp2 = client.post("/api/plan/generate", json=sample_wedding_intake)
    assert resp2.status_code == 429
    assert "Rate limit exceeded" in resp2.json()["detail"]

def test_save_api_key_endpoint(client):
    """Test saving and clearing API key via the /api/config/api-key endpoint."""
    # Test setting a key
    resp = client.post("/api/config/api-key", json={"api_key": "test_fake_key_123"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert resp.json()["operational_mode"] == "live"

    # Test clearing the key
    resp_clear = client.post("/api/config/api-key", json={"api_key": ""})
    assert resp_clear.status_code == 200
    assert resp_clear.json()["status"] == "success"
    assert resp_clear.json()["operational_mode"] == "demo_mode"

def test_recalculate_budget_endpoint(client):
    """Test the budget recalculation endpoint."""
    items = [
        {"id": "b-1", "category": "Venue", "amount": 50000.0, "percentage": 50.0},
        {"id": "b-2", "category": "Catering", "amount": 50000.0, "percentage": 50.0}
    ]
    resp = client.post("/api/budget/recalculate", json={
        "breakdown": items,
        "changed_id": "b-1",
        "new_amount": 70000.0,
        "total_budget": 100000.0
    })
    assert resp.status_code == 200
    breakdown = resp.json()["breakdown"]
    assert len(breakdown) == 2
    sum_amt = sum(i["amount"] for i in breakdown)
    assert abs(sum_amt - 100000.0) <= 1.0

def test_generate_college_and_custom_events_endpoint(client, valid_future_date):
    """Test generating College Event and Custom Event blueprints through the API endpoint."""
    for ev_type in ["College Event", "Custom Event"]:
        time.sleep(config.RATE_LIMIT_COOLDOWN_SECONDS + 0.1)
        payload = {
            "event_type": ev_type,
            "event_name": f"Campus {ev_type}",
            "target_date": valid_future_date,
            "guest_count": 300,
            "total_budget": 300000.0,
            "currency": "INR",
            "location": "Auditorium",
            "theme_keywords": "festive, technology",
            "special_requirements": "Sound and Stage"
        }
        resp = client.post("/api/plan/generate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "budget_breakdown" in data
        assert len(data["budget_breakdown"]) >= 6

def test_invalid_intake_validation_error_format(client, valid_future_date):
    """Ensure invalid intake triggers structured 422 with specific field error details."""
    time.sleep(config.RATE_LIMIT_COOLDOWN_SECONDS + 0.1)
    bad_payload = {
        "event_type": "Wedding",
        "event_name": "", # invalid short name
        "target_date": "2020-01-01", # past date
        "guest_count": -5, # negative guests
        "total_budget": -1000.0, # negative budget
        "currency": "INR"
    }
    resp = client.post("/api/plan/generate", json=bad_payload)
    assert resp.status_code == 422
    err_body = resp.json()
    assert "detail" in err_body

def test_diagnostics_endpoint(client, monkeypatch):
    """Test the in-app diagnostics run endpoint."""
    import pytest
    monkeypatch.setattr(pytest, "main", lambda args: 0)
    resp = client.post("/api/diagnostics/run")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "passed"
    assert data["exit_code"] == 0
    assert "message" in data

def test_service_anandria_status_endpoint(client):
    """Test the internal service status endpoint."""
    resp = client.get("/service/anandria/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "bound" in data

def test_security_headers_enforced(client):
    """Verify security headers are attached to API and static responses."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "default-src" in resp.headers.get("Content-Security-Policy", "")

