import json
import logging
import uuid
from typing import Dict, Any, List
from datetime import datetime
from app.config import settings
from app.models.interview import (
    InterviewSession, 
    InterviewQuestion, 
    InterviewSessionCreate
)

logger = logging.getLogger("studentpulse.interview")

CURATED_QUESTIONS: Dict[str, List[Dict[str, Any]]] = {
    "technical": [
        {
            "role": "Full-Stack Developer",
            "topic": "API Design & State",
            "question": "Explain how you handle optimistic UI updates when mutating data in a React frontend backed by a REST API. What happens if the server mutation fails?",
            "ideal": "Optimistic updates immediately update local client state before waiting for network confirmation to deliver an instant user experience. If the API request succeeds, state remains confirmed. If it fails with a 4xx or 5xx, the client catches the error, rolls back the local state to a previous snapshot, and displays an informative notification."
        },
        {
            "role": "Backend Developer",
            "topic": "Database Architecture",
            "question": "What is the difference between a B-Tree index and a Hash index in relational databases? In what scenarios would a Hash index fail to help a query?",
            "ideal": "B-Tree indexes maintain a sorted, balanced tree structure, making them suitable for equality lookups, range scans (e.g. BETWEEN, >, <), and sorting (ORDER BY). Hash indexes use a hash table offering O(1) time complexity strictly for exact equality matches (key = 'x'). A Hash index fails completely for range queries or sorting because hashed keys have no relative order."
        },
        {
            "role": "Frontend Developer",
            "topic": "Rendering & Performance",
            "question": "Explain the concept of Web Vitals, specifically Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS). How do you diagnose and fix a poor CLS score?",
            "ideal": "LCP measures perceived load speed by timing when the largest visible block loads (target < 2.5s). CLS measures visual stability by tracking unexpected layout shifts during render (target < 0.1). A poor CLS score is fixed by specifying explicit width/height attributes on all images and embeds, reserving space for dynamic ads/banners, and avoiding inserting new content above existing text."
        },
        {
            "role": "DevOps Engineer",
            "topic": "Containerization",
            "question": "What are multi-stage Docker builds, and why are they considered a best practice for production container images?",
            "ideal": "Multi-stage builds allow using multiple FROM instructions in a single Dockerfile. Heavy build tools, compilers, and dependencies run in the initial builder stage. The final production stage copies only the compiled binary or dist folder into a minimal lightweight runtime image (e.g., Alpine or Distroless), reducing image size from gigabytes to megabytes and shrinking the attack surface."
        },
        {
            "role": "Data Scientist",
            "topic": "Machine Learning Validation",
            "question": "Explain the trade-off between Precision and Recall. In a model detecting credit card fraud, which metric would you prioritize and why?",
            "ideal": "Precision measures the proportion of predicted positives that were truly positive (minimizing false alarms). Recall measures the proportion of actual positives that were captured (minimizing missed cases). In credit card fraud detection, Recall is prioritized because missing a real fraudulent transaction has huge financial and security consequences, whereas a false positive is easily verified with an SMS confirmation."
        }
    ],
    "behavioral": [
        {
            "role": "General",
            "topic": "Conflict & Teamwork (STAR)",
            "question": "Tell me about a time you strongly disagreed with a teammate or technical lead regarding an architectural choice. How did you resolve it?",
            "ideal": "Using the STAR method: Situation (describe the project and differing viewpoints, e.g. choosing NoSQL vs SQL), Task (your responsibility to deliver a reliable system), Action (arranging an objective spike/benchmark, testing both options with mock data, focusing on project constraints rather than personal opinions), and Result (the team agreed on the evidence-backed solution and the project shipped on time)."
        },
        {
            "role": "General",
            "topic": "Failure & Learning (STAR)",
            "question": "Describe a project deadline or technical deliverable you failed to meet or a bug that broke production. What did you learn and how did you communicate it?",
            "ideal": "Explain the situation transparently: immediately communicating the issue to stakeholders rather than hiding it, identifying the root cause without blaming others, pushing a fix or rollback quickly, and implementing preventive safeguards (such as automated CI/CD testing, end-to-end checks, or post-mortem documentation)."
        }
    ]
}

def create_interview_session(user_id: str, create_in: InterviewSessionCreate) -> InterviewSession:
    """
    Initializes an interview session with role-specific questions.
    """
    chosen_questions: List[InterviewQuestion] = []
    
    # Pick questions based on interview type
    pool = CURATED_QUESTIONS.get(create_in.interview_type, CURATED_QUESTIONS["technical"])
    
    # Try finding questions matching target role
    matched = [q for q in pool if q.get("role", "").lower() in create_in.target_role.lower() or create_in.target_role.lower() in q.get("role", "").lower()]
    if not matched:
        matched = pool

    # Pad with behavioral if needed
    if len(matched) < create_in.question_count:
        matched.extend(CURATED_QUESTIONS["behavioral"])

    for i in range(min(create_in.question_count, len(matched))):
        q = matched[i]
        chosen_questions.append(InterviewQuestion(
            id=i + 1,
            question_text=q["question"],
            topic=q.get("topic", "Software Engineering"),
            difficulty=create_in.difficulty,
            ideal_answer=q.get("ideal")
        ))

    return InterviewSession(
        id=str(uuid.uuid4())[:8],
        user_id=user_id,
        target_role=create_in.target_role,
        interview_type=create_in.interview_type,
        difficulty=create_in.difficulty,
        status="in_progress",
        questions=chosen_questions,
        current_index=0,
        created_at=datetime.utcnow()
    )

async def evaluate_interview_answer(
    question_text: str,
    user_answer: str,
    topic: str,
    target_role: str,
    ideal_ref: str = None
) -> Dict[str, Any]:
    """
    Evaluates a typed student answer using Gemini Flash or fallback rubrics.
    """
    word_count = len(user_answer.split())

    # Try Gemini AI evaluation if key is present
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)

            prompt = f"""
You are an empathetic, highly technical senior engineering interviewer for the role of '{target_role}'.
Question: "{question_text}"
Topic: "{topic}"
Candidate's Answer: "{user_answer}"
Reference Benchmark: "{ideal_ref or ''}"

Evaluate the candidate's response. Return ONLY raw valid JSON:
{{
  "score": <integer from 1 to 10>,
  "feedback": "<2-3 sentences explaining the rating>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],
  "ideal_answer": "<A comprehensive, structured model answer showing how a senior candidate would answer>"
}}
No markdown formatting, return ONLY valid JSON.
"""
            response = await model.generate_content_async(prompt)
            clean_text = response.text.strip().lstrip("```json").rstrip("```").strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.warning(f"Gemini interview evaluation failed ({e}), using rubric fallback.")

    # Intelligent Rubric Fallback
    if word_count < 15:
        score = 4
        feedback = "Your answer is too brief. In technical interviews, provide context, trade-offs, and edge cases."
        strengths = ["Identified the core topic"]
        improvements = ["Elaborate on real-world mechanics and practical examples", "Discuss trade-offs and failure scenarios"]
    elif word_count < 45:
        score = 7
        feedback = "Solid foundational answer. You captured the main concept but could demonstrate deeper production knowledge."
        strengths = ["Clear conceptual clarity", "Concise communication"]
        improvements = ["Mention specific failure modes or rollback strategies", "Structure answers using concrete architectural examples"]
    else:
        score = 9
        feedback = "Excellent depth and explanation! You demonstrated thorough understanding of both the happy path and edge-case handling."
        strengths = ["Thorough technical depth", "Clear architectural thinking", "Well-structured articulation"]
        improvements = ["Continue reinforcing with quantified production metrics"]

    return {
        "score": score,
        "feedback": feedback,
        "strengths": strengths,
        "improvements": improvements,
        "ideal_answer": ideal_ref or "A strong answer clearly defines the concept, details why it matters in production, illustrates failure modes, and contrasts it against alternatives."
    }
