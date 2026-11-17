from fastapi import APIRouter, HTTPException, Depends
from app.models.interview import (
    InterviewSession, 
    InterviewSessionCreate, 
    SubmitAnswerRequest
)
from app.core.dependencies import get_current_user
from app.database import db_instance, is_db_connected, memory_store, get_or_create_profile, update_profile
from app.services.interview_service import create_interview_session, evaluate_interview_answer
from typing import Dict, Any, List

router = APIRouter(prefix="/api/v1/interview", tags=["AI Mock Interviewer"])

@router.post("/start", response_model=InterviewSession)
async def start_interview(
    payload: InterviewSessionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    session = create_interview_session(current_user["id"], payload)
    session_dict = session.model_dump()

    if is_db_connected():
        res = await db_instance.db["mock_interviews"].insert_one(session_dict)
        session.id = str(res.inserted_id)
    else:
        memory_store["mock_interviews"][session.id] = session_dict

    return session

@router.get("/{session_id}", response_model=InterviewSession)
async def get_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if is_db_connected():
        from bson import ObjectId
        try:
            doc = await db_instance.db["mock_interviews"].find_one({"_id": ObjectId(session_id)})
            if doc:
                doc["id"] = str(doc.pop("_id"))
                return InterviewSession(**doc)
        except Exception:
            pass

    if session_id in memory_store["mock_interviews"]:
        return InterviewSession(**memory_store["mock_interviews"][session_id])

    raise HTTPException(status_code=404, detail="Interview session not found")

@router.post("/{session_id}/submit-answer", response_model=InterviewSession)
async def submit_answer(
    session_id: str,
    payload: SubmitAnswerRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    session = await get_session(session_id, current_user)
    
    # Locate question
    target_q = None
    for q in session.questions:
        if q.id == payload.question_id:
            target_q = q
            break

    if not target_q:
        raise HTTPException(status_code=404, detail="Question ID not found in session")

    # Evaluate answer with AI
    evaluation = await evaluate_interview_answer(
        question_text=target_q.question_text,
        user_answer=payload.user_answer,
        topic=target_q.topic,
        target_role=session.target_role,
        ideal_ref=target_q.ideal_answer
    )

    target_q.user_answer = payload.user_answer
    target_q.score = evaluation.get("score", 7)
    target_q.feedback = evaluation.get("feedback")
    target_q.strengths = evaluation.get("strengths", [])
    target_q.improvements = evaluation.get("improvements", [])
    target_q.ideal_answer = evaluation.get("ideal_answer")

    # Advance current index
    if session.current_index < len(session.questions) - 1:
        session.current_index += 1

    # Check if all questions are answered
    answered_scores = [q.score for q in session.questions if q.score is not None]
    if len(answered_scores) == len(session.questions):
        session.status = "completed"
        # Overall score on 100-point scale
        avg_score = sum(answered_scores) / len(answered_scores)
        session.overall_score = int(avg_score * 10)
        session.summary_feedback = (
            f"You completed the {session.target_role} mock interview with an overall score of {session.overall_score}/100. "
            f"Strongest performance in conceptual definitions. Review the suggested model answers for edge cases."
        )

        # Dynamic readiness score boost for completing interviews
        profile = await get_or_create_profile(current_user["id"])
        current_readiness = profile.get("readiness_score", 35.0)
        new_score = min(round(current_readiness + (session.overall_score * 0.05), 1), 99.0)
        await update_profile(current_user["id"], {"readiness_score": new_score})

    # Save update
    session_dict = session.model_dump()
    if is_db_connected():
        from bson import ObjectId
        await db_instance.db["mock_interviews"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": session_dict}
        )
    else:
        memory_store["mock_interviews"][session_id] = session_dict

    return session

@router.get("/user/history", response_model=List[InterviewSession])
async def get_interview_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    if is_db_connected():
        cursor = db_instance.db["mock_interviews"].find({"user_id": user_id}).sort("created_at", -1)
        history = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            history.append(InterviewSession(**doc))
        return history

    history = [
        InterviewSession(**s) for s in memory_store["mock_interviews"].values()
        if s.get("user_id") == user_id
    ]
    return sorted(history, key=lambda x: x.created_at, reverse=True)
