import json
import logging
from typing import Dict, Any, List
from app.config import settings
from app.models.mentor import ChatResponse
import uuid

logger = logging.getLogger("studentpulse.mentor")

SYSTEM_MENTOR_PERSONA = """You are 'PulseMentor', an elite Senior Software Engineer and Tech Career Advisor at StudentPulse AI.
Your mission is to provide realistic, empathetic, and actionable career guidance to college engineering students.
You tailor your advice directly to the student's background, current skills, projects, and target career goals.
Avoid generic fluff; give concrete technical advice, project architectures, and interview tips.
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

    # Try Gemini Flash
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)

            prompt = f"""
{SYSTEM_MENTOR_PERSONA}

{student_context}

User's Question: "{user_message}"

Respond concisely and professionally in 2 to 4 paragraphs.
At the end of your response, provide a JSON block on a new line:
```json
{{"suggested_follow_ups": ["<Question 1>", "<Question 2>", "<Question 3>"]}}
```
"""
            response = await model.generate_content_async(prompt)
            full_text = response.text.strip()

            follow_ups = [
                "What project should I build next?",
                "How should I explain this in an interview?",
                "Which missing skill should I tackle first?"
            ]

            if "```json" in full_text:
                parts = full_text.split("```json")
                reply_text = parts[0].strip()
                try:
                    json_str = parts[1].split("```")[0].strip()
                    parsed = json.loads(json_str)
                    follow_ups = parsed.get("suggested_follow_ups", follow_ups)
                except Exception:
                    pass
            else:
                reply_text = full_text

            return ChatResponse(
                reply=reply_text,
                conversation_id=conversation_id,
                suggested_follow_ups=follow_ups
            )
        except Exception as e:
            logger.warning(f"Gemini mentor chat error ({e}), using contextual advisor fallback.")

    # Contextual Advisor Fallback
    msg_lower = user_message.lower()

    if "project" in msg_lower or "build" in msg_lower:
        reply = (
            f"Looking at your profile for **{target_roles}**, you already have solid foundational skills in "
            f"{', '.join([s.get('name') for s in profile.get('skills', [])][:3]) or 'programming'}. "
            f"To reach that next readiness tier (currently at {readiness}%), I recommend building an **Asynchronous Task Queue & Notification Service**. "
            f"Architect it using FastAPI, Redis for message queuing, and PostgreSQL for persistent state. "
            f"This demonstrates concurrency, worker threads, and database transaction handling—three topics hiring managers look for in technical interviews."
        )
        follow_ups = [
            "How do I structure the architecture for this project?",
            "What database schema should I use?",
            "How can I test this project with automated CI/CD?"
        ]
    elif "interview" in msg_lower or "prepare" in msg_lower:
        reply = (
            f"For **{target_roles}** interviews, hiring teams typically focus on three distinct areas:\n\n"
            f"1. **Core Language & Framework Internals:** Be ready to explain async event loops, database indexing (B-Trees vs Hash), and state lifecycle in depth.\n"
            f"2. **System & API Design:** Practice designing RESTful schemas, rate limiting, and caching layers with Redis.\n"
            f"3. **Behavioral STAR Technique:** When discussing your past projects, quantify the impact—e.g., 'reduced API response latency by 35%'.\n\n"
            f"Head over to our **AI Interview Prep** tab to run a mock drill right now!"
        )
        follow_ups = [
            "Give me a sample interview question for this role",
            "How should I answer 'Tell me about yourself'?",
            "What are common behavioral pitfalls to avoid?"
        ]
    elif "gap" in msg_lower or "missing" in msg_lower or "learn" in msg_lower:
        reply = (
            f"Based on your latest Skill Gap evaluation for **{target_roles}**, your readiness score is **{readiness}%**. "
            f"Your highest-leverage growth area right now is mastering **Containerization (Docker)** and **Relational Database Query Optimization (PostgreSQL)**. "
            f"These two skills alone will close the critical gap between college theory and production engineering."
        )
        follow_ups = [
            "What resources do you recommend for learning Docker?",
            "How do I practice database query tuning?",
            "Take me to my personalized weekly action plan"
        ]
    else:
        reply = (
            f"Hello! As your career mentor for **{target_roles}**, I'm here to help you bridge your gaps and stand out to hiring managers. "
            f"You currently have {len(profile.get('skills', []))} verified skills and {len(profile.get('projects', []))} portfolio projects, giving you a {readiness}% Career Readiness score.\n\n"
            f"What aspect of your career preparation would you like to tackle today?"
        )
        follow_ups = [
            "What project should I build next to boost my score?",
            "What are the biggest gaps in my current profile?",
            "How should I prepare for technical interviews?"
        ]

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        suggested_follow_ups=follow_ups
    )
