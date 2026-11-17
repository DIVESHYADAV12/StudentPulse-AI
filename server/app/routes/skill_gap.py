from fastapi import APIRouter, HTTPException, Depends
from app.models.analysis import (
    RoleBenchmark, 
    SkillGapAnalysisRequest, 
    SkillGapAnalysisResponse
)
from app.core.dependencies import get_current_user
from app.database import get_or_create_profile, update_profile, db_instance, is_db_connected, memory_store
from app.services.benchmark_service import get_all_benchmarks, get_benchmark_by_title_or_id
from app.services.ai_service import analyze_skill_gap
from typing import Dict, Any, List
from datetime import datetime

router = APIRouter(prefix="/api/v1/skill-gap", tags=["Skill Gap Analyzer"])

@router.get("/benchmarks", response_model=List[RoleBenchmark])
async def list_benchmarks():
    return get_all_benchmarks()

@router.post("/analyze", response_model=SkillGapAnalysisResponse)
async def run_analysis(
    payload: SkillGapAnalysisRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    profile = await get_or_create_profile(current_user["id"])
    analysis = await analyze_skill_gap(profile, payload.target_role)

    # Save analysis in database or memory store
    analysis_dict = analysis.model_dump()
    analysis_dict["user_id"] = current_user["id"]
    analysis_dict["created_at"] = datetime.utcnow()

    if is_db_connected():
        await db_instance.db["skill_analyses"].insert_one(analysis_dict)
    else:
        memory_store["skill_analyses"][current_user["id"]] = analysis_dict

    # Update the student's master readiness score in their profile
    await update_profile(current_user["id"], {
        "readiness_score": analysis.readiness_percentage
    })

    return analysis

@router.get("/latest", response_model=SkillGapAnalysisResponse)
async def get_latest_analysis(current_user: Dict[str, Any] = Depends(get_current_user)):
    profile = await get_or_create_profile(current_user["id"])
    target_role = profile.get("target_roles", ["Full-Stack Developer"])[0]

    # Dynamically re-evaluate against current profile so any newly added skills (e.g. Docker) reflect immediately!
    analysis = await analyze_skill_gap(profile, target_role)
    analysis_dict = analysis.model_dump()
    analysis_dict["user_id"] = current_user["id"]
    analysis_dict["created_at"] = datetime.utcnow()

    if is_db_connected():
        await db_instance.db["skill_analyses"].insert_one(analysis_dict)
    else:
        memory_store["skill_analyses"][current_user["id"]] = analysis_dict

    await update_profile(current_user["id"], {
        "readiness_score": analysis.readiness_percentage
    })

    return analysis
