from fastapi import APIRouter, HTTPException, status, Depends
from app.models.profile import (
    StudentProfile, 
    ProfileUpdate, 
    ProjectCreate, 
    ProjectItem, 
    GitHubSyncRequest, 
    GitHubSyncResponse
)
from app.core.dependencies import get_current_user
from app.database import get_or_create_profile, update_profile, db_instance, is_db_connected, memory_store
from app.services.github_service import fetch_github_profile
from app.services.ai_service import analyze_skill_gap
from typing import Dict, Any
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/v1/profile", tags=["Student Profile"])

@router.get("", response_model=StudentProfile)
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    profile = await get_or_create_profile(current_user["id"])
    return profile

@router.put("", response_model=StudentProfile)
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    update_fields = {}
    if profile_data.education is not None:
        update_fields["education"] = profile_data.education.model_dump()
    if profile_data.skills is not None:
        update_fields["skills"] = [s.model_dump() for s in profile_data.skills]
    if profile_data.target_roles is not None:
        update_fields["target_roles"] = profile_data.target_roles
    if profile_data.github_username is not None:
        update_fields["github_username"] = profile_data.github_username

    updated = await update_profile(current_user["id"], update_fields)
    
    # Automatically recalculate skill gap and readiness score with the new skills
    target_role = updated.get("target_roles", ["Full-Stack Developer"])[0]
    analysis = await analyze_skill_gap(updated, target_role)
    
    analysis_dict = analysis.model_dump()
    analysis_dict["user_id"] = current_user["id"]
    analysis_dict["created_at"] = datetime.utcnow()
    
    if is_db_connected():
        await db_instance.db["skill_analyses"].insert_one(analysis_dict)
    else:
        memory_store["skill_analyses"][current_user["id"]] = analysis_dict

    updated = await update_profile(current_user["id"], {
        "readiness_score": analysis.readiness_percentage
    })
    
    return updated

@router.post("/projects", response_model=StudentProfile)
async def add_project(
    project_in: ProjectCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    profile = await get_or_create_profile(current_user["id"])
    new_project = project_in.model_dump()
    new_project["id"] = str(uuid.uuid4())[:8]

    projects = profile.get("projects", [])
    projects.append(new_project)

    updated = await update_profile(current_user["id"], {"projects": projects})
    
    # Recalculate readiness with project bonus
    target_role = updated.get("target_roles", ["Full-Stack Developer"])[0]
    analysis = await analyze_skill_gap(updated, target_role)
    updated = await update_profile(current_user["id"], {
        "readiness_score": analysis.readiness_percentage
    })
    
    return updated

@router.delete("/projects/{project_id}", response_model=StudentProfile)
async def delete_project(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    profile = await get_or_create_profile(current_user["id"])
    projects = [p for p in profile.get("projects", []) if p.get("id") != project_id]

    updated = await update_profile(current_user["id"], {"projects": projects})
    return updated

@router.post("/sync-github", response_model=GitHubSyncResponse)
async def sync_github(
    payload: GitHubSyncRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    github_data = await fetch_github_profile(payload.username)
    if not github_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"GitHub profile for '{payload.username}' could not be found or accessed"
        )
    
    # Save the verified GitHub username to the profile
    await update_profile(current_user["id"], {"github_username": github_data.username})
    return github_data
