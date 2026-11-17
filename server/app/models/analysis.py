from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class RoleSkillRequirement(BaseModel):
    name: str
    category: str # languages, frameworks, databases, tools, core_cs
    importance: str = "critical" # critical, important, bonus
    description: str

class RoleBenchmark(BaseModel):
    id: str
    role_title: str
    category: str
    description: str
    core_skills: List[RoleSkillRequirement]
    recommended_projects: List[str]

class SkillGapAnalysisRequest(BaseModel):
    target_role: str

class AnalyzedSkill(BaseModel):
    name: str
    category: str
    status: str # "matched", "developing", "missing"
    proficiency: Optional[str] = None
    importance: str = "critical"
    recommendation: Optional[str] = None

class SkillGapAnalysisResponse(BaseModel):
    id: Optional[str] = None
    target_role: str
    readiness_percentage: float
    matched_skills_count: int
    missing_skills_count: int
    analyzed_skills: List[AnalyzedSkill]
    ai_summary: str
    priority_action_items: List[str]
    recommended_project_ideas: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DashboardOverviewResponse(BaseModel):
    readiness_score: float
    target_roles: List[str]
    skills_count: int
    projects_count: int
    github_connected: bool
    radar_data: List[Dict[str, Any]]
    latest_analysis: Optional[SkillGapAnalysisResponse] = None
    quick_recommendations: List[str]
