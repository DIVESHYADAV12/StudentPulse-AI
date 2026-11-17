from fastapi import APIRouter, Depends
from app.models.analysis import DashboardOverviewResponse, SkillGapAnalysisResponse
from app.core.dependencies import get_current_user
from app.database import get_or_create_profile, db_instance, is_db_connected, memory_store
from app.services.ai_service import analyze_skill_gap
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    profile = await get_or_create_profile(current_user["id"])
    target_role = profile.get("target_roles", ["Full-Stack Developer"])[0]

    # Calculate domain scores for the radar chart
    skills = profile.get("skills", [])
    cat_counts = {
        "languages": 0,
        "frameworks": 0,
        "databases": 0,
        "tools": 0,
        "core_cs": 0
    }
    for s in skills:
        cat = s.get("category", "languages")
        prof = s.get("proficiency", "intermediate")
        points = 30 if prof == "advanced" else (20 if prof == "intermediate" else 10)
        cat_counts[cat] = min(cat_counts.get(cat, 0) + points, 100)

    radar_data = [
        {"domain": "Languages", "score": max(cat_counts["languages"], 25), "fullMark": 100},
        {"domain": "Frameworks", "score": max(cat_counts["frameworks"], 20), "fullMark": 100},
        {"domain": "Databases", "score": max(cat_counts["databases"], 20), "fullMark": 100},
        {"domain": "DevOps & Tools", "score": max(cat_counts["tools"], 15), "fullMark": 100},
        {"domain": "Core CS", "score": max(cat_counts["core_cs"], 20), "fullMark": 100},
    ]

    # Always generate up-to-date analysis from the student's latest skills
    latest_analysis = await analyze_skill_gap(profile, target_role)
    raw_dict = latest_analysis.model_dump()
    raw_dict["user_id"] = current_user["id"]
    if is_db_connected():
        await db_instance.db["skill_analyses"].insert_one(raw_dict)
    else:
        memory_store["skill_analyses"][current_user["id"]] = raw_dict

    # Dynamic quick recommendations
    quick_recs = []
    if len(skills) < 5:
        quick_recs.append("Add more technical skills to your profile to get a more accurate evaluation.")
    if len(profile.get("projects", [])) == 0:
        quick_recs.append("Add at least 1 real-world project to showcase your hands-on experience (+15% score boost).")
    if not profile.get("github_username"):
        quick_recs.append("Connect your public GitHub username to verify repository activity and top languages.")
    if latest_analysis and latest_analysis.missing_skills_count > 0:
        missing_sample = [s.name for s in latest_analysis.analyzed_skills if s.status == "missing"][:2]
        if missing_sample:
            quick_recs.append(f"Focus on learning {', '.join(missing_sample)} required for {target_role}.")

    return DashboardOverviewResponse(
        readiness_score=profile.get("readiness_score", latest_analysis.readiness_percentage),
        target_roles=profile.get("target_roles", ["Full-Stack Developer"]),
        skills_count=len(skills),
        projects_count=len(profile.get("projects", [])),
        github_connected=bool(profile.get("github_username")),
        radar_data=radar_data,
        latest_analysis=latest_analysis,
        quick_recommendations=quick_recs[:4]
    )
