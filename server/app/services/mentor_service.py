import json
import logging
from typing import Dict, Any, List
from app.config import settings
from app.models.mentor import ChatResponse
import uuid

logger = logging.getLogger("studentpulse.mentor")

SYSTEM_MENTOR_PERSONA = """You are 'PulseMentor', an elite Senior Staff Engineer and Tech Career Advisor at StudentPulse AI.
Your mission is to provide structured, realistic, and highly actionable career guidance to college engineering students.

CRITICAL FORMATTING INSTRUCTIONS (STRICT):
1. NEVER output a wall of dense text or unstructured paragraphs.
2. Structure your entire response in clear, organized bullet points with bold section headers.
3. Highlight all important terms, technologies, frameworks, and architecture patterns in **bold** (e.g. **FastAPI**, **Docker Multi-Stage**, **Redis Cache**, **B-Tree Indexing**, **STAR Method**).
4. Organize every response into these 3 structured sections:
   - 🎯 **Direct Recommendation**: 1-2 punchy bullet points directly answering the student's question.
   - 📌 **Key Action Steps & Tech Stack**: Bulleted roadmap detailing exact tools, architecture patterns, and what to build/study.
   - 💡 **Interview & Career Pro-Tip**: Concrete advice on how hiring managers evaluate this and how to explain it in interviews.
5. Keep points concise, punchy, and easy to scan.
"""

async def generate_mentor_reply(
    user_message: str,
    profile: Dict[str, Any],
    history: List[Dict[str, str]],
    conversation_id: str
) -> ChatResponse:
    """
    Generates a personalized career guidance response using Gemini Flash or fallback advisor.
    """
    skills = [f"{s.get('name')} ({s.get('proficiency')})" for s in profile.get("skills", [])]
    projects = [f"{p.get('title')}: {p.get('description')}" for p in profile.get("projects", [])]
    target_roles = ", ".join(profile.get("target_roles", ["Full-Stack Developer"]))
    readiness = profile.get("readiness_score", 35.0)

    student_context = f"""
Student Background:
- Degree: {profile.get('education', {}).get('degree', 'Computer Science')} (Grad {profile.get('education', {}).get('grad_year', 2026)})
- Target Roles: {target_roles}
- Career Readiness Score: {readiness}%
- Current Verified Skills: {', '.join(skills) if skills else 'None recorded yet'}
- Portfolio Projects: {'; '.join(projects) if projects else 'None recorded yet'}
"""

    default_follow_ups = [
        "What project should I build next to boost my score?",
        "How should I explain this in an interview?",
        "Which missing skill should I tackle first?"
    ]

    # Groq AI is mandatory
    if not settings.GROQ_API_KEY or len(settings.GROQ_API_KEY) < 5:
        return ChatResponse(
            reply=(
                "⚠️ **Groq AI is mandatory for PulseMentor.**\n\n"
                "Please open `server/.env` in your backend and set your Groq API key on line 21:\n"
                "```env\n"
                "GROQ_API_KEY=gsk_your_groq_api_key_here\n"
                "```\n"
                "Once saved, restart the backend server or refresh to begin chatting with PulseMentor."
            ),
            conversation_id=conversation_id,
            suggested_follow_ups=["Where do I find my Groq API key?"]
        )

    try:
        from groq import AsyncGroq
        groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

        groq_messages = [
            {
                "role": "system",
                "content": f"""{SYSTEM_MENTOR_PERSONA}

Current Student Context:
{student_context}

Respond strictly in well-structured bullet points, with bold section headers and **bold highlights** for all key technical terms. Avoid writing long dense paragraphs.
Format your final output as valid JSON with:
{{
  "reply": "<your beautifully organized markdown response using bullet points, section headers, and bold highlights>",
  "suggested_follow_ups": ["<Short question 1>", "<Short question 2>", "<Short question 3>"]
}}"""
            }
        ]

        # Append last 4 messages from conversation history for context
        if history:
            for msg in history[-4:]:
                r = "user" if msg.get("role") in ["user", "student"] else "assistant"
                groq_messages.append({"role": r, "content": msg.get("content", "")})

        groq_messages.append({"role": "user", "content": user_message})

        models_to_try = [settings.GROQ_MODEL]
        if "qwen/qwen3.8-27b" not in models_to_try:
            models_to_try.append("qwen/qwen3.8-27b")
        if "llama3-70b-8192" not in models_to_try:
            models_to_try.append("llama3-70b-8192")

        completion = None
        last_err = None
        for model_name in models_to_try:
            try:
                completion = await groq_client.chat.completions.create(
                    model=model_name,
                    messages=groq_messages,
                    response_format={"type": "json_object"},
                    temperature=0.6,
                    max_tokens=800
                )
                if completion and completion.choices:
                    break
            except Exception as me:
                last_err = me
                continue

        if not completion:
            raise last_err

        raw_json = completion.choices[0].message.content
        parsed = json.loads(raw_json)
        return ChatResponse(
            reply=parsed.get("reply", "Here is your career guidance."),
            conversation_id=conversation_id,
            suggested_follow_ups=parsed.get("suggested_follow_ups", default_follow_ups)
        )
    except Exception as e:
        logger.error(f"Groq mentor error: {e}")
        return ChatResponse(
            reply=f"⚠️ Groq API connection error: {str(e)}. Please check your `GROQ_API_KEY` in `server/.env`.",
            conversation_id=conversation_id,
            suggested_follow_ups=default_follow_ups
        )
