from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
from enum import Enum

class SkillProficiency(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class SkillCategory(str, Enum):
    LANGUAGES = "languages"
    FRAMEWORKS = "frameworks"
    DATABASES = "databases"
    DEVOPS_CLOUD = "devops_cloud"
    TOOLS = "tools"
    CORE_CS = "core_cs"

class SkillItem(BaseModel):
    name: str = Field(..., min_length=1)
    category: SkillCategory = SkillCategory.LANGUAGES
    proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE

class ProjectItem(BaseModel):
    id: str
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    tech_stack: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None

class EducationInfo(BaseModel):
    university: str = ""
    degree: str = ""
    grad_year: Optional[int] = None
    cgpa: Optional[float] = None

class GitHubRepoSummary(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    html_url: str
    topics: List[str] = Field(default_factory=list)
    tech_stack: List[str] = Field(default_factory=list)
    updated_at: Optional[str] = None
    is_fork: bool = False

class GitHubSyncRequest(BaseModel):
    username: str = Field(..., min_length=1)

class GitHubSyncResponse(BaseModel):
    username: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int = 0
    top_languages: List[str] = Field(default_factory=list)
    detected_skills: List[str] = Field(default_factory=list)
    repositories: List[GitHubRepoSummary] = Field(default_factory=list)

class StudentProfile(BaseModel):
    id: Optional[str] = None
    user_id: str
    education: EducationInfo = Field(default_factory=EducationInfo)
    skills: List[SkillItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    target_roles: List[str] = Field(default_factory=lambda: ["Full-Stack Developer"])
    github_username: Optional[str] = None
    github_repos: List[GitHubRepoSummary] = Field(default_factory=list)
    readiness_score: float = Field(default=0.0, ge=0.0, le=100.0)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProfileUpdate(BaseModel):
    education: Optional[EducationInfo] = None
    skills: Optional[List[SkillItem]] = None
    target_roles: Optional[List[str]] = None
    github_username: Optional[str] = None
    github_repos: Optional[List[GitHubRepoSummary]] = None

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    tech_stack: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None

class ImportGitHubProjectsRequest(BaseModel):
    repo_names: Optional[List[str]] = None # None or empty means import all
