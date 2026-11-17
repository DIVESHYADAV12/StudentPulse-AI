import uuid
from typing import Dict, Any, List
from datetime import datetime
from app.models.action_plan import ActionPlan, PlanWeek, PlanTask
from app.services.benchmark_service import get_benchmark_by_title_or_id

def generate_action_plan(user_id: str, profile: Dict[str, Any], target_role: str) -> ActionPlan:
    """
    Generates a personalized 4-week sprint plan tailored to the student's target role and gaps.
    """
    benchmark = get_benchmark_by_title_or_id(target_role)
    student_skills = {s.get("name", "").lower() for s in profile.get("skills", [])}

    missing_core = [
        s.name for s in benchmark.core_skills 
        if s.name.lower() not in student_skills
    ]

    focus_skill_1 = missing_core[0] if len(missing_core) > 0 else "Advanced RESTful APIs"
    focus_skill_2 = missing_core[1] if len(missing_core) > 1 else "Database Indexing & Caching"
    focus_skill_3 = missing_core[2] if len(missing_core) > 2 else "Docker & Cloud Deployments"

    weeks = [
        PlanWeek(
            week_number=1,
            theme="Foundations & Core Architecture",
            goal=f"Master fundamental mechanics of {focus_skill_1} and write clean, modular code.",
            tasks=[
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title=f"Study {focus_skill_1} Syntax and Core Design Principles",
                    category="theory",
                    description=f"Read official documentation and explore production code patterns for {focus_skill_1}.",
                    points=15
                ),
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title=f"Build a Micro-Component Implementing {focus_skill_1}",
                    category="project",
                    description="Write working code with input validation and error handling.",
                    points=25
                ),
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title="Solve 3 Role-Related Coding Problems",
                    category="practice",
                    description="Focus on algorithmic efficiency (O(n) time complexity).",
                    points=15
                )
            ]
        ),
        PlanWeek(
            week_number=2,
            theme="Data Modeling & Persistence",
            goal=f"Strengthen database design, schemas, and query optimization around {focus_skill_2}.",
            tasks=[
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title=f"Deep Dive: {focus_skill_2} & ACID Properties",
                    category="theory",
                    description="Understand relational constraints vs NoSQL document embedding.",
                    points=15
                ),
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title="Design an Entity Relationship Diagram (ERD)",
                    category="project",
                    description="Create a database schema for an e-commerce or booking platform.",
                    points=20
                ),
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title="Complete 1 Technical Mock Interview Round",
                    category="interview",
                    description="Practice explaining database trade-offs out loud.",
                    points=25
                )
            ]
        ),
        PlanWeek(
            week_number=3,
            theme="DevOps, Testing & Quality",
            goal=f"Containerize your applications with {focus_skill_3} and write automated unit tests.",
            tasks=[
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title=f"Containerize a Backend Service with {focus_skill_3}",
                    category="project",
                    description="Create a multi-stage Dockerfile and docker-compose orchestration file.",
                    points=30
                ),
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title="Write Comprehensive Unit Tests (>80% coverage)",
                    category="practice",
                    description="Test edge cases, 404s, 401s, and malformed request bodies.",
                    points=20
                )
            ]
        ),
        PlanWeek(
            week_number=4,
            theme="Capstone Portfolio & Interview Readiness",
            goal="Publish your project on GitHub with a professional README and complete mock drills.",
            tasks=[
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title=f"Deploy Capstone Project to Cloud: {benchmark.recommended_projects[0]}",
                    category="project",
                    description="Deploy to Render, Railway, or AWS and document the live URL.",
                    points=40
                ),
                PlanTask(
                    id=str(uuid.uuid4())[:8],
                    title="Complete Behavioral & STAR Method Interview Simulation",
                    category="interview",
                    description="Simulate real questions on project challenges, failures, and teamwork.",
                    points=30
                )
            ]
        )
    ]

    total_tasks = sum(len(w.tasks) for w in weeks)
    
    return ActionPlan(
        id=str(uuid.uuid4())[:8],
        user_id=user_id,
        target_role=target_role,
        weeks=weeks,
        total_tasks=total_tasks,
        completed_tasks=0,
        progress_percentage=0.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

def recalculate_plan_progress(plan: ActionPlan) -> ActionPlan:
    total = 0
    completed = 0
    for w in plan.weeks:
        for t in w.tasks:
            total += 1
            if t.is_completed:
                completed += 1
    
    plan.total_tasks = total
    plan.completed_tasks = completed
    plan.progress_percentage = round((completed / total * 100), 1) if total > 0 else 0.0
    plan.updated_at = datetime.utcnow()
    return plan
