from fastapi import APIRouter, HTTPException, Depends
from app.models.action_plan import ActionPlan, TaskToggleRequest, CustomTaskCreate, PlanTask
from app.core.dependencies import get_current_user
from app.database import get_or_create_profile, update_profile, db_instance, is_db_connected, memory_store
from app.services.action_plan_service import generate_action_plan, recalculate_plan_progress
from typing import Dict, Any
import uuid

router = APIRouter(prefix="/api/v1/action-plan", tags=["Personalized Action Plan"])

@router.get("/current", response_model=ActionPlan)
async def get_current_plan(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    profile = await get_or_create_profile(user_id)
    target_role = profile.get("target_roles", ["Full-Stack Developer"])[0]

    if is_db_connected():
        plan_dict = await db_instance.db["action_plans"].find_one({"user_id": user_id})
        if plan_dict:
            plan_dict["id"] = str(plan_dict.pop("_id"))
            return ActionPlan(**plan_dict)

    if user_id in memory_store["action_plans"]:
        return ActionPlan(**memory_store["action_plans"][user_id])

    # Generate initial plan if none exists
    new_plan = generate_action_plan(user_id, profile, target_role)
    new_plan_dict = new_plan.model_dump()
    new_plan_dict["user_id"] = user_id

    if is_db_connected():
        res = await db_instance.db["action_plans"].insert_one(new_plan_dict)
        new_plan.id = str(res.inserted_id)
    else:
        memory_store["action_plans"][user_id] = new_plan_dict

    return new_plan

@router.post("/generate", response_model=ActionPlan)
async def regenerate_plan(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    profile = await get_or_create_profile(user_id)
    target_role = profile.get("target_roles", ["Full-Stack Developer"])[0]

    new_plan = generate_action_plan(user_id, profile, target_role)
    new_plan_dict = new_plan.model_dump()
    new_plan_dict["user_id"] = user_id

    if is_db_connected():
        await db_instance.db["action_plans"].replace_one(
            {"user_id": user_id},
            new_plan_dict,
            upsert=True
        )
    else:
        memory_store["action_plans"][user_id] = new_plan_dict

    return new_plan

@router.patch("/tasks/{task_id}", response_model=ActionPlan)
async def toggle_task(
    task_id: str,
    payload: TaskToggleRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    active_plan = await get_current_plan(current_user)
    
    found = False
    for week in active_plan.weeks:
        for task in week.tasks:
            if task.id == task_id:
                task.is_completed = payload.is_completed
                found = True
                break
        if found:
            break

    if not found:
        raise HTTPException(status_code=404, detail="Task not found in active action plan")

    updated_plan = recalculate_plan_progress(active_plan)
    updated_dict = updated_plan.model_dump()
    updated_dict["user_id"] = user_id

    if is_db_connected():
        await db_instance.db["action_plans"].update_one(
            {"user_id": user_id},
            {"$set": updated_dict}
        )
    else:
        memory_store["action_plans"][user_id] = updated_dict

    # Boost student readiness score dynamically when tasks are completed
    profile = await get_or_create_profile(user_id)
    current_score = profile.get("readiness_score", 35.0)
    # Add a slight progression boost proportional to completed percentage
    score_bump = min(round(current_score + (1.5 if payload.is_completed else -1.5), 1), 99.0)
    await update_profile(user_id, {"readiness_score": max(score_bump, 10.0)})

    return updated_plan
