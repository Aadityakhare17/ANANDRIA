# ANANDRIA – GenAI Event Planning Assistant

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Tests](https://img.shields.io/badge/Tests-20%20Passed-brightgreen.svg)]()

> **ANANDRIA** is a production-grade, full-stack GenAI event planning assistant designed for **Weddings, Birthdays, and Community Events**. It pairs Google's Gemini 2.0 Flash (with Structured JSON Output) and an intelligent deterministic simulator engine with a responsive, WCAG 2.1 AA compliant vanilla HTML5/CSS3/JavaScript frontend.

---

## 1. Chosen Vertical
**Event Management & Lifestyle Consumer Tech — GenAI-Powered Personal & Community Event Planning (ANANDRIA).**

Organizing large milestones (multi-day weddings, milestone birthdays, cultural festivals) involves multi-variable constraints: volatile guest headcounts, category-specific budget tradeoffs, time-critical vendor negotiations, and culturally sensitive creative styling. ANANDRIA automates this planning lifecycle from zero-to-one into a structured, executable blueprint.

---

## 2. Approach and Logic: Deterministic + Generative Hybrid Architecture

Large Language Models excel at creative ideation, contextual theme synthesis, and semantic task decomposition, but often make arithmetic rounding errors when managing floating-point currency calculations.

ANANDRIA solves this through a **Hybrid Architecture**:
```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INPUT & INTAKE WIZARD                      │
│      (Event Type, Name, Target Date, Guests, Budget, Currency, Style)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │   INPUT SANITIZER & PROMPT INJECTION DEFENSE (Python)   │
       │   - Bleach HTML stripping (anti-XSS)                    │
       │   - Regex injection pattern detector                    │
       │   - Future-date & positive bounds validation            │
       └────────────────────────────┬────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
               ▼                                         ▼
   [GENERATIVE SUBSYSTEM]                     [DETERMINISTIC SUBSYSTEM]
   Google Gemini 2.0 Flash                    Python Budget Engine & JS
   Strict JSON Schema Constraints             - Proportional Slider Rebalancer
   - Tailored Theme Concepts                  - Exact 100.0% Allocation Lock
   - Curated Color Hex Palettes               - Over-Budget Variance Detection
   - Culturally Aware Menus                   - Chronological Milestone Dates
   - Guest Engagement Activities              - LocalStorage State Persistence
               │                                         │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    INTERACTIVE DASHBOARD & CO-PILOT                    │
│   • Budget Breakdown (SVG Donut Chart, Progress Bars, Sliders)         │
│   • Actionable Timeline (Phased Milestones, Days Countdown, Checks)    │
│   • Vendor Checklist (Pending/Contacted/Booked Toggles, Filters)       │
│   • Creative Ideas (Copyable Hex Swatches, Menu Lists, Decor Tips)     │
│   • Guests & RSVPs (Meal Preferences, Seating Matrix, CSV Export)      │
│   • In-App API Key Configurator & Live Currency Switcher (INR/USD/EUR) │
│   • AI Co-Pilot Dock (Natural Language Refinements, Quick Chips)       │
│   • 1-Click Multi-Format Export (JSON, Markdown, Print / PDF)          │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Generative Role (Gemini 2.0 Flash / Structured JSON Schema)**:
   - Synthesizes personalized themes, color palettes with hex values, regionally authentic menu concepts, and guest activity games.
   - Decomposes planning timelines into chronological countdown milestones from today up to post-event settlement.
   - Generates actionable vendor items with priority tags and realistic regional cost estimations.
2. **Deterministic Role (Python backend + JavaScript client)**:
   - Guarantees mathematical precision: category percentages strictly sum to 100%, and currency allocations equal the total budget.
   - Real-time proportional slider recalculations: adjusting one slider recalculates other categories without drift.
   - Over-budget warning triggers and variance alerts when actual expenses exceed allocations.
   - Offline fallback simulation when `GEMINI_API_KEY` is not present, guaranteeing complete evaluability.

---

## 3. How the Solution Works

### Step-by-Step User Flow
1. **Intake Wizard**: The user selects an event category (*Wedding*, *Birthday*, or *Community Event*), enters celebration name, target date, guest count, total budget with currency selection (INR ₹, USD $, EUR €, GBP £), and optional vibe keywords/special dietary needs. (A **"✨ Fill Sample Wedding"** button allows 1-click test evaluations).
2. **Input Sanitization & Injection Defense**: The backend strips HTML tags (mitigating XSS) and checks for prompt-override tokens (e.g., `ignore previous instructions`).
3. **Structured Generation**:
   - In **Live Mode**: Calls Gemini 2.0 Flash via `@google/genai` with strict `response_mime_type="application/json"` and Pydantic validation.
   - In **Demo Mode**: The high-fidelity simulator generates culturally nuanced blueprints offline.
4. **Interactive Dashboard**:
   - **Budget Tab**: SVG donut chart, allocated vs. actual progress bars, editable sliders, and real-time over-budget warning badges.
   - **Timeline Tab**: Countdown clock to event day, grouped phases (*6+ Months Out*, *1 Week Out*, *Event Day*), with interactive milestone checkboxes.
   - **Vendor Checklist Tab**: Searchable list with quick status toggles (*Pending*, *Contacted*, *Booked*) and dynamic percentage completion bar.
   - **Ideas & Palettes Tab**: Visual cards, clickable hex color swatches that copy to clipboard, and curated menu/activity lists.
5. **AI Co-Pilot Refinements**: Quick-action chips (*"Trim Budget by 15%"*, *"Go Eco-Friendly"*, *"Add Rain Contingency"*) or custom natural language prompts refine the plan in real time.
6. **Multi-Format Export**: One-click download of the complete blueprint as JSON, structured Markdown, or formatted printable PDF.

---

## 4. Setup and Run Instructions

### Prerequisites
- Python 3.10 or higher
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Installation & Execution
```bash
# 1. Clone repository and navigate to project root
git clone <repo-url>
cd "d:\Prompt wars\Challenge 5"

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Configure Gemini API Key
# Copy .env.example to .env and insert your free Gemini API key:
# GEMINI_API_KEY=AIzaSy...
# (If omitted, ANANDRIA automatically runs in high-fidelity Demo Simulator mode)

# 4. Start the Application Server
python run.py
```

The application will start immediately on:
👉 **`http://127.0.0.1:8000`**

### Running the Automated Test Suite
```bash
# Run all 20 automated tests via pytest
python -m pytest backend/tests -v
```

You can also run tests **in-app** by clicking the **"Self-Diagnostics"** button in the top navigation bar.

---

## 5. Evaluation Focus Alignment

| Dimension | Implementation Details in ANANDRIA |
| :--- | :--- |
| **Code Quality** | Modular separation of concerns (`/backend/services`, `/backend/utils`, `/backend/tests`, `/static/css`, `/static/js`). Typed Pydantic models for request/response schemas. Comprehensive docstrings, clean variable naming, and idiomatic asynchronous FastAPI patterns. |
| **Security** | Zero hardcoded credentials (loaded strictly via `python-dotenv`). Multi-layer input sanitization using `bleach` to eliminate XSS. Regex-based prompt injection detection. Sliding-window IP rate limiting to mitigate DoS and API exhaustion. |
| **Efficiency** | Client-side `localStorage` caching eliminates redundant API roundtrips on browser refresh. Slider adjustments and vendor search filters are debounced for 60fps rendering performance. Direct SVG rendering for charts without external heavy dependencies. |
| **Testing** | 20 automated unit and integration tests across 4 test modules (`test_budget_math.py`, `test_sanitizer.py`, `test_schema_parser.py`, `test_api_endpoints.py`). Real-time in-app self-test modal executes both client assertions and live backend pytest executions. |
| **Accessibility** | Built to WCAG 2.1 AA specifications. Semantic HTML5 landmarks (`<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`). All form inputs have explicit `<label>` tags and `aria-describedby` helper texts. Dynamic `aria-live="polite"` regions for AI loading and budget warnings. Full keyboard navigation (`Tab`, `ArrowLeft`/`ArrowRight` for tabs, `Escape` for modals) with visible `:focus-visible` high-contrast outlines. Guaranteed 4.5:1 text contrast ratios. |

---

## 6. Assumptions Made
1. **Browser Storage**: Users have standard `localStorage` enabled for session persistence across page refreshes.
2. **Cost Estimations**: Budget and vendor estimates generated by the AI represent regional planning baselines and serve as budgeting guidelines rather than legally binding vendor quotes.
3. **Offline Evaluability**: If no `GEMINI_API_KEY` is configured in `.env`, the system automatically activates the intelligent deterministic simulator so evaluators can test every feature, chart, slider, and co-pilot action offline without API setup.

---

## 7. Directory Structure
```
├── backend/
│   ├── services/
│   │   └── gemini_service.py     # Gemini 2.0 Flash SDK client & Fallback Simulator
│   ├── utils/
│   │   ├── budget_calc.py        # Deterministic math, rebalancing & over-budget checks
│   │   ├── sanitizer.py          # XSS stripping, prompt injection detection, validators
│   │   └── schemas.py            # Pydantic models for structured JSON request/response
│   ├── tests/
│   │   ├── conftest.py           # Pytest fixtures and test clients
│   │   ├── test_api_endpoints.py # Tests for health, generate, refine & rate-limiting
│   │   ├── test_budget_math.py   # Tests for 100% allocation sum & slider math
│   │   ├── test_sanitizer.py     # Tests for negative budgets, dates, XSS & injections
│   │   └── test_schema_parser.py # Tests for AI JSON schema compliance & malformed JSON
│   ├── config.py                 # Environment variables & runtime settings
│   └── main.py                   # FastAPI application, static file serving & REST endpoints
├── static/
│   ├── css/
│   │   └── styles.css            # WCAG 2.1 AA compliant celebration design system
│   ├── js/
│   │   ├── api.js                # REST client for backend communication
│   │   ├── app.js                # Core controller, state manager & view switcher
│   │   ├── budget.js             # SVG Donut chart, progress bars & interactive sliders
│   │   ├── copilot.js            # AI Co-pilot refinement bar & quick chips
│   │   ├── diagnostics.js        # In-app self-test runner
│   │   ├── ideas.js              # Theme cards, copyable hex swatches & menu items
│   │   ├── storage.js            # LocalStorage caching & multi-format exports
│   │   ├── timeline.js           # Countdown clock, phases & interactive milestones
│   │   └── vendors.js            # Searchable checklist, status toggles & progress bar
│   └── index.html                # Accessible semantic HTML5 application
├── .env.example                  # Environment variable configuration template
├── .env                          # Local environment variables
├── requirements.txt              # Python package dependencies
├── run.py                        # Server startup entry point
└── README.md                     # Comprehensive project documentation
```
