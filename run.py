import uvicorn
from backend import config

if __name__ == "__main__":
    print("=" * 65)
    print("  ANANDRIA – GenAI Event Planning Assistant (Python Full-Stack)")
    print(f"  Server starting on: http://{config.HOST}:{config.PORT}")
    print(f"  Operational Mode  : {'LIVE (Gemini API)' if config.GEMINI_API_KEY and not config.DEMO_MODE else 'DEMO / MOCK SIMULATOR'}")
    print("=" * 65)
    uvicorn.run("backend.main:app", host=config.HOST, port=config.PORT, reload=True)
