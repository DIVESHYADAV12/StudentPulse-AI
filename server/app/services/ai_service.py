import json
import logging
from typing import Dict, Any, List
from app.config import settings
from app.models.analysis import (
    SkillGapAnalysisResponse, 
    AnalyzedSkill, 
    RoleBenchmark
)
from app.services.benchmark_service import get_benchmark_by_title_or_id
import uuid
from datetime import datetime

logger = logging.getLogger("studentpulse.ai")

async def analyze_skill_gap(profile: Dict[str, Any], target_role: str) -> SkillGapAnalysisResponse:
    """
    Evaluates a student's profile against an industry benchmark role.
    Uses Gemini Flash if configured, or the deterministic fallback engine.
    """
    benchmark: RoleBenchmark = get_benchmark_by_title_or_id(target_role)
    
    student_skills = profile.get("skills", [])
    student_projects = profile.get("projects", [])
    
    # Map student skills for fast lookup (case-insensitive)
    student_skill_map = {
        s.get("name", "").strip().lower(): s.get("proficiency", "intermediate")
        for s in student_skills
    }
    
    analyzed_skills: List[AnalyzedSkill] = []
    matched_count = 0
    total_weight = 0
    earned_weight = 0

    # Weights by importance
    weight_map = {"critical": 3.0, "important": 2.0, "bonus": 1.0}
    proficiency_multiplier = {"beginner": 0.5, "intermediate": 0.85, "advanced": 1.0}

    for req in benchmark.core_skills:
        req_name_lower = req.name.strip().lower()
        w = weight_map.get(req.importance, 2.0)
        total_weight += w

        # Direct or semantic match check
        found = False
        matched_proficiency = None

        for s_name, prof in student_skill_map.items():
            if s_name == req_name_lower or s_name in req_name_lower or req_name_lower in s_name:
                found = True
                matched_proficiency = prof
                break

        if found:
            matched_count += 1
            mult = proficiency_multiplier.get(matched_proficiency, 0.8)
            earned_weight += (w * mult)
            
            analyzed_skills.append(AnalyzedSkill(
                name=req.name,
                category=req.category,
                status="matched" if mult >= 0.8 else "developing",
                proficiency=matched_proficiency,
                importance=req.importance,
                recommendation=f"Good proficiency in {req.name}. Keep practicing through advanced projects."
            ))
        else:
            analyzed_skills.append(AnalyzedSkill(
                name=req.name,
                category=req.category,
                status="missing",
                proficiency=None,
                importance=req.importance,
                recommendation=f"Crucial for {benchmark.role_title}. {req.description}"
            ))

    # Calculate baseline skill percentage
    skill_score = (earned_weight / total_weight * 100) if total_weight > 0 else 0.0

    # Project bonus boost (up to +15% based on hands-on project count)
    project_bonus = min(len(student_projects) * 5.0, 15.0)
    final_readiness = min(round(skill_score + project_bonus, 1), 98.0)

    missing_count = len(benchmark.core_skills) - matched_count

    # Try Gemini AI enhancement if key is provided
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)

            prompt = f"""
You are a senior tech hiring manager evaluating a college student for the role of '{benchmark.role_title}'.
Student Profile:
- Current Skills: {[s.get('name') for s in student_skills]}
- Projects Built: {[p.get('title') for p in student_projects]}
- Benchmark Required Skills: {[s.name for s in benchmark.core_skills]}
- Calculated Match Readiness: {final_readiness}%

Provide a concise JSON response with:
1. "ai_summary": A motivating, realistic 2-sentence executive summary of their readiness.
2. "priority_action_items": An array of 3 specific technical action items they should do this month to close gaps.
3. "recommended_project_ideas": An array of 2 practical portfolio project ideas tailored to their missing skills.

Return ONLY raw valid JSON, no markdown backticks.
"""
            response = await model.generate_content_async(prompt)
            clean_text = response.text.strip().lstrip("```json").rstrip("```").strip()
            ai_data = json.loads(clean_text)

            return SkillGapAnalysisResponse(
                id=str(uuid.uuid4())[:8],
                target_role=benchmark.role_title,
                readiness_percentage=final_readiness,
                matched_skills_count=matched_count,
                missing_skills_count=missing_count,
                analyzed_skills=analyzed_skills,
                ai_summary=ai_data.get("ai_summary", f"You currently match {matched_count} out of {len(benchmark.core_skills)} core skills for {benchmark.role_title}."),
                priority_action_items=ai_data.get("priority_action_items", [
                    f"Bridge missing critical skills: {', '.join([s.name for s in analyzed_skills if s.status == 'missing'][:3])}",
                    "Build a capstone project demonstrating end-to-end implementation.",
                    "Practice technical interview explanations for core concepts."
                ]),
                recommended_project_ideas=ai_data.get("recommended_project_ideas", benchmark.recommended_projects[:2]),
                created_at=datetime.utcnow()
            )
        except Exception as e:
            logger.warning(f"Gemini API call failed or rate limited ({e}), falling back to deterministic synthesis.")

    # High quality deterministic synthesis fallback
    missing_critical = [s.name for s in analyzed_skills if s.status == "missing" and s.importance == "critical"]
    missing_str = ", ".join(missing_critical[:3]) if missing_critical else "advanced tooling and cloud practices"

    summary = (
        f"You match {matched_count} out of {len(benchmark.core_skills)} core requirements for {benchmark.role_title}. "
        f"Your strongest leverage will come from closing gaps in {missing_str}."
    )

    action_items = [
        f"Prioritize mastering {missing_str} through hands-on project tutorials.",
        f"Deepen proficiency in existing tools from 'Intermediate' to 'Advanced' with production-grade tests.",
        "Document and publish your existing projects with clear GitHub READMEs and live deployment links."
    ]

    return SkillGapAnalysisResponse(
        id=str(uuid.uuid4())[:8],
        target_role=benchmark.role_title,
        readiness_percentage=final_readiness,
        matched_skills_count=matched_count,
        missing_skills_count=missing_count,
        analyzed_skills=analyzed_skills,
        ai_summary=summary,
        priority_action_items=action_items,
        recommended_project_ideas=benchmark.recommended_projects,
        created_at=datetime.utcnow()
    )
