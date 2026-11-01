import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from root .env and fallback anandria/.env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "anandria" / ".env")

# Accept both GEMINI_API_KEY and VITE_GEMINI_API_KEY
GEMINI_API_KEY = (
    os.getenv("GEMINI_API_KEY", "") or
    os.getenv("VITE_GEMINI_API_KEY", "")
).strip()

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "127.0.0.1")
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")

# Rate limit cooldown in seconds between plan generation requests per client IP
RATE_LIMIT_COOLDOWN_SECONDS = 3

# Vercel Multi-Service Binding
ANANDRIA_SERVICE_URL = os.getenv("ANANDRIA_SERVICE_URL", "").rstrip("/")

