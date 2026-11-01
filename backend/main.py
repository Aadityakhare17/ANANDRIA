import time
from pathlib import Path
from typing import Dict, Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend import config
from backend.utils.schemas import EventIntakeRequest, RefinePlanRequest, EventPlanResponse
from backend.utils.sanitizer import validate_and_sanitize_intake, sanitize_text, detect_prompt_injection
from backend.utils.budget_calc import recalculate_slider_adjustment
from backend.services.gemini_service import (
    generate_mock_event_plan,
    generate_live_gemini_plan,
    refine_event_plan
)

app = FastAPI(
    title="ANANDRIA API",
    description="GenAI-Powered Event Planning Assistant Backend",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static and Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

# In-memory IP-based rate limiting table
ip_request_history: Dict[str, float] = {}

def check_rate_limit(client_ip: str):
    """Enforces request cooldown to prevent denial of service and API abuse."""
    now = time.time()
    last_req = ip_request_history.get(client_ip, 0)
    elapsed = now - last_req
    if elapsed < config.RATE_LIMIT_COOLDOWN_SECONDS:
        wait_time = round(config.RATE_LIMIT_COOLDOWN_SECONDS - elapsed, 1)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Please wait {wait_time}s before submitting again."
        )
    ip_request_history[client_ip] = now

# Mount static folder
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serves the main single-page application."""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        index_file = BASE_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend index.html not found.")
    return FileResponse(index_file)

@app.get("/api/health")
async def health_check():
    """Returns application health and operational mode (live vs demo)."""
    has_key = bool(config.GEMINI_API_KEY)
    is_live = has_key and not config.DEMO_MODE
    return {
        "status": "healthy",
        "app_name": "ANANDRIA",
        "operational_mode": "live" if is_live else "demo_mode",
        "gemini_configured": has_key,
        "cooldown_seconds": config.RATE_LIMIT_COOLDOWN_SECONDS,
        "timestamp": time.time()
    }

@app.post("/api/plan/generate", response_model=EventPlanResponse)
async def generate_plan(request: Request, intake: EventIntakeRequest):
    """
    Validates input parameters, enforces rate-limiting, and generates a structured event plan.
    """
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    # Sanitize and validate inputs
    intake_dict = intake.model_dump()
    is_valid, errors, sanitized = validate_and_sanitize_intake(intake_dict)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Validation failed", "errors": errors}
        )

    # Choose between Live Gemini API or Fallback Simulator
    if config.DEMO_MODE or not config.GEMINI_API_KEY:
        plan = generate_mock_event_plan(sanitized)
    else:
        try:
            plan = generate_live_gemini_plan(sanitized)
        except Exception as e:
            # Fallback to demo simulator gracefully on API error
            plan = generate_mock_event_plan(sanitized)
            plan["mode"] = "demo_mode_fallback"
            plan["summary"] += f" (Notice: Live API call encountered an issue: {str(e)[:80]}. Generated via high-fidelity simulator)."

    return plan

@app.post("/api/plan/refine", response_model=EventPlanResponse)
async def refine_plan_endpoint(request: Request, body: RefinePlanRequest):
    """
    Refines an existing plan with natural language directives.
    """
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    try:
        refined = refine_event_plan(
            current_plan=body.current_plan,
            refinement_prompt=body.refinement_prompt,
            event_details=body.event_details.model_dump()
        )
        return refined
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Refinement failed: {str(e)}")

@app.post("/api/budget/recalculate")
async def recalculate_budget_endpoint(payload: Dict[str, Any]):
    """
    Recalculates budget line items when a slider is adjusted on the backend.
    """
    breakdown = payload.get("breakdown", [])
    changed_id = payload.get("changed_id", "")
    new_amount = float(payload.get("new_amount", 0.0))
    total_budget = float(payload.get("total_budget", 0.0))

    updated = recalculate_slider_adjustment(breakdown, changed_id, new_amount, total_budget)
    return {"breakdown": updated}

@app.post("/api/diagnostics/run")
async def run_diagnostics():
    """
    Executes automated backend tests and reports status for the in-app self-test modal.
    """
    import pytest
    from io import StringIO
    import sys

    # Run pytest directly against the backend/tests directory
    tests_dir = str(BASE_DIR / "backend" / "tests")
    exit_code = pytest.main(["-q", tests_dir])

    return {
        "status": "passed" if exit_code == 0 else "failed",
        "exit_code": int(exit_code),
        "message": "All automated backend tests executed successfully." if exit_code == 0 else "Some tests reported warnings or failures."
    }

@app.post("/api/config/api-key")
async def save_api_key(payload: Dict[str, str]):
    """
    Saves or clears the Gemini API key, persists it to .env, and updates operational mode.
    """
    new_key = payload.get("api_key", "").strip()
    config.GEMINI_API_KEY = new_key
    env_path = BASE_DIR / ".env"
    lines = [
        "# ANANDRIA Configuration\n",
        f"GEMINI_API_KEY={new_key}\n",
        f"PORT={config.PORT}\n",
        f"HOST={config.HOST}\n",
        "DEMO_MODE=false\n"
    ]
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    is_live = bool(new_key)
    return {
        "status": "success",
        "operational_mode": "live" if is_live else "demo_mode",
        "message": "API Key saved! Live Gemini 2.0 Flash generation active." if is_live else "Key cleared. Switched to high-fidelity Demo Simulator."
    }

