from typing import List, Optional, Literal
from pydantic import BaseModel, Field

EventType = Literal["Wedding", "Birthday", "Community Event", "College Event", "Custom Event"]
Currency = Literal["INR", "USD", "EUR", "GBP"]
VendorStatus = Literal["Pending", "Contacted", "Booked"]
Priority = Literal["High", "Medium", "Low"]

class EventIntakeRequest(BaseModel):
    event_type: EventType = Field(..., description="Wedding, Birthday, Community Event, College Event, or Custom Event")
    event_name: str = Field(..., min_length=2, max_length=120)
    target_date: str = Field(..., description="Target event date in YYYY-MM-DD format")
    guest_count: int = Field(..., gt=0, le=50000, description="Total expected guests")
    total_budget: float = Field(..., gt=0, le=1_000_000_000, description="Total budget amount")
    currency: Currency = Field(default="INR")
    location: Optional[str] = Field(default="", max_length=150)
    theme_keywords: Optional[str] = Field(default="", max_length=300)
    special_requirements: Optional[str] = Field(default="", max_length=800)

class RefinePlanRequest(BaseModel):
    refinement_prompt: str = Field(..., min_length=2, max_length=400)
    current_plan: dict = Field(..., description="Current complete event plan dictionary")
    event_details: EventIntakeRequest

class BudgetCategory(BaseModel):
    id: str
    category: str
    amount: float = Field(..., ge=0)
    percentage: float = Field(..., ge=0, le=100)
    notes: Optional[str] = ""
    actual_spend: float = Field(default=0.0, ge=0)

class TimelineMilestone(BaseModel):
    id: str
    phase: str
    task: str
    description: Optional[str] = ""
    due_date: str
    completed: bool = False
    priority: Priority = "Medium"

class VendorItem(BaseModel):
    id: str
    vendor: str
    task: str
    category: str
    status: VendorStatus = "Pending"
    priority: Priority = "Medium"
    estimated_cost: float = Field(default=0.0, ge=0)
    notes: Optional[str] = ""

class ThemeConcept(BaseModel):
    name: str
    description: str

class ColorPalette(BaseModel):
    name: str
    colors: List[str] = Field(..., description="List of Hex codes e.g. ['#7C3AED', '#EC4899']")
    mood: Optional[str] = ""

class PersonalizedIdeas(BaseModel):
    themes: List[ThemeConcept]
    color_palettes: List[ColorPalette]
    menu_ideas: List[str]
    activities: List[str]
    decor_tips: Optional[List[str]] = Field(default_factory=list)
    entertainment_ideas: Optional[List[str]] = Field(default_factory=list)

class EventPlanResponse(BaseModel):
    summary: str
    estimated_cost_per_head: float
    budget_breakdown: List[BudgetCategory]
    timeline: List[TimelineMilestone]
    vendor_checklist: List[VendorItem]
    personalized_ideas: PersonalizedIdeas
    mode: str = Field(default="live", description="'live' or 'demo_mode'")
