import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from backend.main import app
from backend import config

@pytest.fixture
def client(monkeypatch):
    """Provides a synchronized test client with demo mode enabled and short rate limits."""
    monkeypatch.setattr(config, "DEMO_MODE", True)
    monkeypatch.setattr(config, "RATE_LIMIT_COOLDOWN_SECONDS", 0.05)
    return TestClient(app)

@pytest.fixture
def valid_future_date():
    """Generates an ISO date 180 days in the future for testing."""
    return (date.today() + timedelta(days=180)).strftime("%Y-%m-%d")

@pytest.fixture
def sample_wedding_intake(valid_future_date):
    """Provides a canonical realistic wedding intake payload for testing."""
    return {
        "event_type": "Wedding",
        "event_name": "Rohan & Ananya Wedding",
        "target_date": valid_future_date,
        "guest_count": 250,
        "total_budget": 1500000.0,
        "currency": "INR",
        "location": "Jaipur, Rajasthan",
        "theme_keywords": "royal, floral, vintage heritage",
        "special_requirements": "Jain-friendly catering, wheelchair ramp for entrance"
    }
