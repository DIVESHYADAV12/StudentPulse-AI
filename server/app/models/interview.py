from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class InterviewQuestion(BaseModel):
    id: int
    question_text: str
    topic: str
    difficulty: str = "entry_level" # entry_level, mid_level
    user_answer: Optional[str] = None
    score: Optional[int] = None # 1 to 10
    feedback: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    ideal_answer: Optional[str] = None

class InterviewSessionCreate(BaseModel):
    target_role: str
    interview_type: str = "technical" # technical, behavioral
    difficulty: str = "entry_level"
    question_count: int = Field(default=3, ge=1, le=5)

class SubmitAnswerRequest(BaseModel):
    question_id: int
    user_answer: str = Field(..., min_length=2)

class InterviewSession(BaseModel):
    id: str
    user_id: str
    target_role: str
    interview_type: str
    difficulty: str
    status: str = "in_progress" # in_progress, completed
    questions: List[InterviewQuestion]
    current_index: int = 0
    overall_score: Optional[int] = None # 0 to 100
    summary_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
