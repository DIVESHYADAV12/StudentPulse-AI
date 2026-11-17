from fastapi import APIRouter, Depends
from app.models.mentor import ChatRequest, ChatResponse, ChatMessage
from app.core.dependencies import get_current_user
from app.database import get_or_create_profile, db_instance, is_db_connected, memory_store
from app.services.mentor_service import generate_mentor_reply
from typing import Dict, Any, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/v1/mentor", tags=["AI Career Guidance Mentor"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_mentor(
    payload: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    profile = await get_or_create_profile(user_id)
    conversation_id = payload.conversation_id or str(uuid.uuid4())[:8]

    # Save user message
    user_msg = {
        "id": str(uuid.uuid4())[:8],
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": "user",
        "content": payload.message,
        "timestamp": datetime.utcnow()
    }

    history: List[Dict[str, str]] = []
    if is_db_connected():
        await db_instance.db["chat_sessions"].insert_one(user_msg)
        cursor = db_instance.db["chat_sessions"].find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1)
        async for m in cursor:
            history.append({"role": m["role"], "content": m["content"]})
    else:
        if conversation_id not in memory_store["chat_sessions"]:
            memory_store["chat_sessions"][conversation_id] = []
        memory_store["chat_sessions"][conversation_id].append(user_msg)
        history = [{"role": m["role"], "content": m["content"]} for m in memory_store["chat_sessions"][conversation_id]]

    # Generate response
    response = await generate_mentor_reply(
        user_message=payload.message,
        profile=profile,
        history=history,
        conversation_id=conversation_id
    )

    # Save assistant message
    asst_msg = {
        "id": str(uuid.uuid4())[:8],
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": "assistant",
        "content": response.reply,
        "timestamp": datetime.utcnow()
    }

    if is_db_connected():
        await db_instance.db["chat_sessions"].insert_one(asst_msg)
    else:
        memory_store["chat_sessions"][conversation_id].append(asst_msg)

    return response

@router.get("/history/{conversation_id}", response_model=List[ChatMessage])
async def get_chat_history(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if is_db_connected():
        cursor = db_instance.db["chat_sessions"].find(
            {"conversation_id": conversation_id, "user_id": current_user["id"]}
        ).sort("timestamp", 1)
        messages = []
        async for m in cursor:
            messages.append(ChatMessage(
                id=str(m.get("_id", m.get("id"))),
                role=m["role"],
                content=m["content"],
                timestamp=m["timestamp"]
            ))
        return messages

    if conversation_id in memory_store["chat_sessions"]:
        return [
            ChatMessage(
                id=m["id"],
                role=m["role"],
                content=m["content"],
                timestamp=m["timestamp"]
            )
            for m in memory_store["chat_sessions"][conversation_id]
        ]
    return []
