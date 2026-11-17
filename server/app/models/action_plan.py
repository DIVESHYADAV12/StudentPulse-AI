from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PlanTask(BaseModel):
    id: str
    title: str
    category: str # "theory", "project", "practice", "interview"
    description: Optional[str] = None
    resource_url: Optional[str] = None
    is_completed: bool = False
    points: int = 15

class PlanWeek(BaseModel):
    week_number: int
    theme: str
    goal: str
    tasks: List[PlanTask]

class ActionPlan(BaseModel):
    id: Optional[str] = None
    user_id: str
    target_role: str
    weeks: List[PlanWeek]
    total_tasks: int = 0
    completed_tasks: int = 0
    progress_percentage: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskToggleRequest(BaseModel):
    is_completed: bool

class CustomTaskCreate(BaseModel):
    week_number: int = 1
    title: str = Field(..., min_length=2)
    category: str = "practice"
    description: Optional[str] = None
