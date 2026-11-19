import json
import logging
import uuid
import re
from typing import Dict, Any, List, Set, Optional
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
            "keywords": ["optimistic", "ui", "state", "react", "rollback", "error", "api", "mutation", "revert", "snapshot", "catch"],
            "ideal": "Optimistic updates immediately update local client state before waiting for network confirmation to deliver an instant user experience. If the API request succeeds, state remains confirmed. If it fails with a 4xx or 5xx, the client catches the error, rolls back the local state to a previous snapshot, and displays an informative notification."
        },
        {
            "role": "Backend Developer",
            "topic": "Database Architecture",
            "question": "What is the difference between a B-Tree index and a Hash index in relational databases? In what scenarios would a Hash index fail to help a query?",
            "keywords": ["btree", "b-tree", "hash", "index", "range", "equality", "o(1)", "order", "sort", "search", "table", "pointer"],
            "ideal": "B-Tree indexes maintain a sorted, balanced tree structure, making them suitable for equality lookups, range scans (e.g. BETWEEN, >, <), and sorting (ORDER BY). Hash indexes use a hash table offering O(1) time complexity strictly for exact equality matches (key = 'x'). A Hash index fails completely for range queries or sorting because hashed keys have no relative order."
        },
        {
            "role": "Frontend Developer",
            "topic": "Rendering & Performance",
            "question": "Explain the concept of Web Vitals, specifically Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS). How do you diagnose and fix a poor CLS score?",
            "keywords": ["lcp", "cls", "vitals", "render", "layout", "shift", "paint", "dimension", "image", "aspect", "viewport", "speed"],
            "ideal": "LCP measures perceived load speed by timing when the largest visible block loads (target < 2.5s). CLS measures visual stability by tracking unexpected layout shifts during render (target < 0.1). A poor CLS score is fixed by specifying explicit width/height attributes on all images and embeds, reserving space for dynamic ads/banners, and avoiding inserting new content above existing text."
        },
        {
            "role": "DevOps Engineer",
            "topic": "Containerization",
            "question": "What are multi-stage Docker builds, and why are they considered a best practice for production container images?",
            "keywords": ["docker", "multi-stage", "stage", "build", "image", "size", "production", "alpine", "distroless", "runtime", "binary", "layer"],
            "ideal": "Multi-stage builds allow using multiple FROM instructions in a single Dockerfile. Heavy build tools, compilers, and dependencies run in the initial builder stage. The final production stage copies only the compiled binary or dist folder into a minimal lightweight runtime image (e.g., Alpine or Distroless), reducing image size from gigabytes to megabytes and shrinking the attack surface."
        },
        {
            "role": "Data Scientist",
            "topic": "Machine Learning Validation",
            "question": "Explain the trade-off between Precision and Recall. In a model detecting credit card fraud, which metric would you prioritize and why?",
            "keywords": ["precision", "recall", "trade-off", "tradeoff", "fraud", "false positive", "false negative", "metric", "detection", "f1"],
            "ideal": "Precision measures the proportion of predicted positives that were truly positive (minimizing false alarms). Recall measures the proportion of actual positives that were captured (minimizing missed cases). In credit card fraud detection, Recall is prioritized because missing a real fraudulent transaction has huge financial and security consequences, whereas a false positive is easily verified with an SMS confirmation."
        }
    ],
    "behavioral": [
        {
            "role": "General",
            "topic": "Conflict & Teamwork (STAR)",
            "question": "Tell me about a time you strongly disagreed with a teammate or technical lead regarding an architectural choice. How did you resolve it?",
            "keywords": ["star", "situation", "task", "action", "result", "disagree", "team", "conflict", "communication", "architecture", "tradeoff"],
            "ideal": "Using the STAR method: Situation (describe the project and differing viewpoints, e.g. choosing NoSQL vs SQL), Task (your responsibility to deliver a reliable system), Action (arranging an objective spike/benchmark, testing both options with mock data, focusing on project constraints rather than personal opinions), and Result (the team agreed on the evidence-backed solution and the project shipped on time)."
        },
        {
            "role": "General",
            "topic": "Failure & Learning (STAR)",
            "question": "Describe a project deadline or technical deliverable you failed to meet or a bug that broke production. What did you learn and how did you communicate it?",
            "keywords": ["failure", "deadline", "bug", "production", "learn", "incident", "postmortem", "safeguard", "testing", "transparency"],
            "ideal": "Explain the situation transparently: immediately communicating the issue to stakeholders rather than hiding it, identifying the root cause without blaming others, pushing a fix or rollback quickly, and implementing preventive safeguards (such as automated CI/CD testing, end-to-end checks, or post-mortem documentation)."
        }
    ]
}

def is_gibberish_or_spam(text: str) -> bool:
    """
    Detects keyboard mashing, repeated characters, common non-answers, or nonsensical text.
    """
    cleaned = text.strip().lower()
    if len(cleaned) < 8:
        return True

    # Check common non-answers, test fillers, or explicit gibberish mentions
    spam_phrases = ['gibberish', 'jibrish', 'blah blah', 'asdf', 'i don\'t know', 'idk', 'test test', 'no idea']
    if any(phrase in cleaned for phrase in spam_phrases):
        if len(cleaned.split()) <= 8:
            return True

    words = re.findall(r'[a-z]+', cleaned)
    if not words:
        return True

    # Repeated single character: e.g. 'aaaa', '.....'
    if re.search(r'(.)\1{3,}', cleaned):
        return True

    # Repeated sequence of 2-10 characters: e.g. 'asdfasdf', 'testtesttest'
    if re.search(r'(.{2,10})\1{2,}', cleaned):
        return True

    # Keyboard home row / consecutive mash pattern
    mash_patterns = ['asdf', 'qwer', 'zxcv', 'hjkl', 'ghjk', 'dfgh', 'erty', 'uiop', 'cvbn']
    mash_hits = sum(1 for p in mash_patterns if p in cleaned)
    if mash_hits >= 1 and len(cleaned.split()) <= 4:
        return True

    total_letters = sum(len(w) for w in words)
    vowels = sum(c in 'aeiou' for c in cleaned if c.isalpha())
    
    # Abnormal vowel ratio (standard English is 25-50% vowels)
    if total_letters > 10 and (vowels / total_letters < 0.20 or vowels / total_letters > 0.65):
        return True

    # Check for words with 5+ consecutive consonants (e.g. 'sdfghjk', 'kjahsdf')
    if re.search(r'[^aeiou\s]{5,}', cleaned):
        return True

    return False

    return False

def calculate_relevance_score(user_answer: str, question_text: str, topic: str, ideal_ref: str = None) -> float:
    answer_tokens = set(re.findall(r'[a-z0-9]+', user_answer.lower()))
    corpus = f"{question_text} {topic} {ideal_ref or ''}".lower()
    ref_tokens = set(re.findall(r'[a-z0-9]+', corpus))
    stopwords = {"the", "a", "an", "is", "are", "and", "or", "in", "on", "for", "with", "what", "how", "why", "when", "that", "this", "to", "of", "it", "you", "your", "we", "if"}
    domain_tokens = ref_tokens - stopwords
    if not domain_tokens:
        return 0.5
    overlap = answer_tokens.intersection(domain_tokens)
    return len(overlap) / min(len(domain_tokens), 12)

def create_interview_session(user_id: str, create_in: InterviewSessionCreate) -> InterviewSession:
    chosen_questions: List[InterviewQuestion] = []
    pool = CURATED_QUESTIONS.get(create_in.interview_type, CURATED_QUESTIONS["technical"])
    
    matched = [q for q in pool if q.get("role", "").lower() in create_in.target_role.lower() or create_in.target_role.lower() in q.get("role", "").lower()]
    if not matched:
        matched = pool

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
    Evaluates a candidate's spoken or typed response.
    Prioritizes Groq AI (Llama 3.3 70B), falls back to Gemini or strict rubric.
    """
    cleaned_answer = user_answer.strip()

    # Step 1: Pre-filter gibberish / nonsensical speech
    if is_gibberish_or_spam(cleaned_answer):
        return {
            "score": 0,
            "feedback": "Your response was flagged as nonsensical speech or keyboard gibberish. In a real technical interview, failing to communicate a coherent answer results in an immediate fail (0/10). Please speak or write clearly about the requested technical topic.",
            "strengths": [],
            "improvements": [
                "Clearly address the technical topic asked",
                "Structure your verbal answer with clear architectural concepts",
                "Explain real-world trade-offs and implementation considerations"
            ],
            "ideal_answer": ideal_ref or "A proper answer defines the core concept clearly, contrasts trade-offs, and details production considerations."
        }

    # Step 2: Groq AI Evaluation (Llama 3.3 70B) — Mandatory AI provider
    if not settings.GROQ_API_KEY or len(settings.GROQ_API_KEY) < 5:
        return {
            "score": 0,
            "feedback": "⚠️ Groq AI is mandatory. Please add your GROQ_API_KEY to server/.env in the backend (line 21: GROQ_API_KEY=gsk_...) to enable live evaluation.",
            "strengths": [],
            "improvements": ["Set GROQ_API_KEY in server/.env"],
            "ideal_answer": ideal_ref or "Add GROQ_API_KEY in server/.env to enable AI evaluation."
        }

    try:
        from groq import AsyncGroq
        groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

        system_prompt = f"""You are a distinguished Senior Principal Engineer and Technical Interviewer at a top technology company.
You are conducting a live interview for a candidate applying for the role of '{target_role}'.
Evaluate the candidate's spoken or written answer with rigorous, objective, and constructive feedback.

STRICT EVALUATION CRITERIA:
1. If the candidate's answer is gibberish, microphone noise, off-topic spam, or shows zero comprehension of the question, award a score of 0 or 1 out of 10. Leave "strengths" as an empty list [].
2. If the answer is superficial or incomplete, award 3 to 5 out of 10.
3. Award 7 to 10 out of 10 only if the candidate explains accurate technical mechanisms, trade-offs, and architecture.
4. Output MUST be valid raw JSON matching the schema below."""

        user_prompt = f"""Question Asked: "{question_text}"
Topic: "{topic}"
Target Role: "{target_role}"
Candidate's Response: "{cleaned_answer}"
Reference Benchmark: "{ideal_ref or ''}"

Return ONLY valid JSON matching this exact structure:
{{
  "score": <integer from 0 to 10>,
  "feedback": "<2-3 sentences of direct, objective hiring manager critique>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>"],
  "ideal_answer": "<A comprehensive, structured model answer showing how a senior engineer would answer this question in a live interview>"
}}"""

        models_to_try = [settings.GROQ_MODEL]
        if "qwen/qwen3.8-27b" not in models_to_try:
            models_to_try.append("qwen/qwen3.8-27b")
        if "llama3-70b-8192" not in models_to_try:
            models_to_try.append("llama3-70b-8192")

        chat_completion = None
        last_err = None
        for model_name in models_to_try:
            try:
                chat_completion = await groq_client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                if chat_completion and chat_completion.choices:
                    break
            except Exception as me:
                last_err = me
                continue

        if not chat_completion:
            raise last_err

        raw_json = chat_completion.choices[0].message.content
        return json.loads(raw_json)
    except Exception as e:
        logger.error(f"Groq interview evaluation error: {e}")
        return {
            "score": 0,
            "feedback": f"Groq evaluation error: {str(e)}. Please ensure your GROQ_API_KEY in server/.env is valid.",
            "strengths": [],
            "improvements": ["Check backend GROQ_API_KEY validity"],
            "ideal_answer": ideal_ref or "Model answer temporarily unavailable."
        }

async def generate_final_interview_evaluation(
    session: InterviewSession,
    profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Synthesizes the entire interview session using Groq AI.
    Produces a deeply personalized evaluation and experienced veteran recommendations on where to improve.
    """
    target_role = session.target_role
    difficulty = session.difficulty
    interview_type = session.interview_type

    qa_summary_lines = []
    total_score = 0
    valid_answers = 0

    for i, q in enumerate(session.questions, 1):
        score_val = q.score if q.score is not None else 0
        total_score += score_val
        valid_answers += 1
        qa_summary_lines.append(
            f"Question {i} [{q.topic}]: \"{q.question_text}\"\n"
            f"Candidate Answer: \"{q.user_answer or 'No answer provided'}\"\n"
            f"Score Given: {score_val}/10\n"
            f"Critique: {q.feedback or 'N/A'}\n"
            f"Identified Strengths: {', '.join(q.strengths) if q.strengths else 'None'}\n"
            f"Areas for Improvement: {', '.join(q.improvements) if q.improvements else 'None'}"
        )

    calculated_overall = int((total_score / (valid_answers * 10)) * 100) if valid_answers > 0 else 0
    transcript_text = "\n\n".join(qa_summary_lines)

    if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 5:
        try:
            from groq import AsyncGroq
            groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

            system_prompt = f"""You are a distinguished Principal Staff Engineer and Engineering Director with 15+ years of experience hiring software engineers for '{target_role}' positions at Tier-1 tech companies.
You have just concluded a comprehensive {difficulty.replace('_', ' ')} {interview_type} mock interview round with a candidate.
Your goal is to provide an authentic, deeply personalized, and constructive end-of-round evaluation report.

Tone & Persona:
- Speak directly to the candidate ('you', 'your') with empathetic authority, real-world wisdom, and high engineering standards.
- Avoid generic fluff. Mention concrete architectural mechanisms, real production pitfalls (e.g. race conditions, database deadlocks, connection pooling, cache stampedes, idempotency, horizontal scalability).
- Clearly explain WHERE they need to improve and WHAT concrete projects or tools they must build/study next to reach hire-ready status.
- Return ONLY valid JSON matching the exact schema."""

            user_prompt = f"""Target Role: {target_role}
Difficulty Level: {difficulty}
Interview Round: {interview_type}
Round Average Score: {calculated_overall}/100

Full Session Transcript & Question Scores:
{transcript_text}

Generate a personalized end-of-interview evaluation formatted as raw JSON:
{{
  "overall_score": {calculated_overall},
  "hiring_verdict": "<Choose one: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'Needs Development'>",
  "executive_summary": "<2-3 detailed paragraphs evaluating their performance: conceptual understanding, depth of technical articulation, trade-off reasoning, and live readiness for {target_role} roles>",
  "key_strengths": [
    "<Specific technical concept or pattern they demonstrated effectively>",
    "<Second specific strength>"
  ],
  "key_improvements": [
    "<High-priority technical gap they must address before real live interviews>",
    "<Second specific area to improve with engineering context>"
  ],
  "mentor_advice": "<Deep, actionable advice written like an experienced engineering leader in {target_role}: exact system design topics, production safeguards (e.g. circuit breakers, indexing, concurrency controls), and specific portfolio architectures they should build over the next 2-3 weeks to stand out to hiring managers>"
}}"""

            models_to_try = [settings.GROQ_MODEL]
            if "qwen/qwen3.8-27b" not in models_to_try:
                models_to_try.append("qwen/qwen3.8-27b")
            if "llama3-70b-8192" not in models_to_try:
                models_to_try.append("llama3-70b-8192")

            completion = None
            for model_name in models_to_try:
                try:
                    completion = await groq_client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.3
                    )
                    if completion and completion.choices:
                        break
                except Exception as me:
                    logger.warning(f"Groq final evaluation try failed with model {model_name}: {me}")
                    continue

            if completion and completion.choices:
                raw_json = completion.choices[0].message.content
                parsed = json.loads(raw_json)
                return {
                    "overall_score": parsed.get("overall_score", calculated_overall),
                    "hiring_verdict": parsed.get("hiring_verdict", "Hire" if calculated_overall >= 70 else "Needs Development"),
                    "executive_summary": parsed.get("executive_summary", f"You completed the {target_role} interview round with a cumulative score of {calculated_overall}/100."),
                    "key_strengths": parsed.get("key_strengths", ["Solid foundational terminology"]),
                    "key_improvements": parsed.get("key_improvements", ["Deepen production architectural explanations and edge-case handling"]),
                    "mentor_advice": parsed.get("mentor_advice", f"Focus on building end-to-end architectures demonstrating database transactions and async worker queues for {target_role}.")
                }
        except Exception as e:
            logger.error(f"Error calling Groq for final evaluation: {e}")

    # Fallback if Groq call failed or key absent
    verdict = "Strong Hire" if calculated_overall >= 85 else ("Hire" if calculated_overall >= 70 else ("Lean Hire" if calculated_overall >= 50 else "Needs Development"))
    return {
        "overall_score": calculated_overall,
        "hiring_verdict": verdict,
        "executive_summary": (
            f"You completed the {target_role} mock interview round with an overall score of {calculated_overall}/100. "
            f"Across the questions asked, you showed familiarity with the high-level concepts, but to satisfy senior hiring bars, "
            f"you must structure your responses with deeper production considerations, such as latency bottlenecks, rollback procedures, and data consistency."
        ),
        "key_strengths": [
            "Clear familiarity with core domain vocabulary",
            "Direct engagement with the scenario prompts"
        ],
        "key_improvements": [
            "Elaborate on production failure modes, rollback mechanisms, and telemetry",
            "Quantify trade-offs (e.g. memory overhead, query latency, complexity) rather than giving binary answers"
        ],
        "mentor_advice": (
            f"As someone who has evaluated hundreds of {target_role} candidates, my advice is to stop just explaining theory and practice "
            f"talking about production systems. Build a project involving concurrent requests and stress test it with mock network failures. "
            f"When an interviewer asks how a system works, walk them through the happy path, the failure path, and how you monitor it in production."
        )
    }
