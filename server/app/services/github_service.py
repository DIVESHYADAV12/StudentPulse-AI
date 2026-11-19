import httpx
import logging
import re
from typing import Optional, List, Dict, Set
from collections import Counter
from app.models.profile import GitHubSyncResponse, GitHubRepoSummary

logger = logging.getLogger("studentpulse.github")

# Canonical tech keywords dictionary for scanning repo titles and descriptions
KNOWN_TECH_KEYWORDS = [
    "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte",
    "FastAPI", "Flask", "Django", "Express", "Node.js", "NestJS", "Spring Boot",
    "Tailwind CSS", "Bootstrap", "Sass", "Material-UI", "Chakra UI",
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Prisma", "SQLAlchemy",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Firebase", "Supabase",
    "GraphQL", "REST API", "WebSockets", "gRPC", "Kafka", "RabbitMQ",
    "TypeScript", "JavaScript", "Python", "Go", "Golang", "Rust", "Java", "C++", "C#", "PHP",
    "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy", "OpenCV", "LangChain",
    "Jest", "PyTest", "Cypress", "Selenium", "Git"
]

def extract_tech_stack_for_repo(repo: Dict) -> List[str]:
    """
    Extracts and standardizes the tech stack for a repository from its language,
    topics, name, and description.
    """
    techs: Set[str] = set()

    # 1. Primary language
    primary_lang = repo.get("language")
    if primary_lang:
        techs.add(primary_lang)

    # 2. Topics / tags
    topics = repo.get("topics", [])
    for topic in topics:
        topic_clean = topic.strip().replace("-", " ").title()
        # Look for known match or format nicely
        matched_known = next((k for k in KNOWN_TECH_KEYWORDS if k.lower() == topic.lower().replace("-", "")), None)
        if matched_known:
            techs.add(matched_known)
        else:
            techs.add(topic_clean)

    # 3. Scan name and description for prominent tech keywords
    text_corpus = f"{repo.get('name', '')} {repo.get('description', '')}"
    for kw in KNOWN_TECH_KEYWORDS:
        # Match as whole word case-insensitively
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, text_corpus.lower()):
            techs.add(kw)

    return sorted(list(techs), key=lambda x: (x != primary_lang, x))

async def fetch_github_profile(username: str) -> Optional[GitHubSyncResponse]:
    """
    Fetches public profile and ALL public repositories for a GitHub user.
    Extracts comprehensive tech stack tags for every project.
    """
    clean_username = username.strip().lstrip("@")
    if not clean_username:
        return None

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "StudentPulse-AI-Platform"
    }

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            # 1. Fetch user base info
            user_res = await client.get(
                f"https://api.github.com/users/{clean_username}",
                headers=headers
            )
            
            if user_res.status_code == 404:
                return None
            if user_res.status_code != 200:
                logger.warning(f"GitHub API returned status {user_res.status_code} for user {clean_username}")
                return None
                
            user_data = user_res.json()

            # 2. Fetch all public repositories (up to 100 per page, sorted by updated)
            repos_res = await client.get(
                f"https://api.github.com/users/{clean_username}/repos?per_page=100&sort=updated",
                headers=headers
            )
            
            repos_data = repos_res.json() if repos_res.status_code == 200 else []

            # 3. Analyze repositories, languages, and technologies
            languages = []
            detected_skills: Set[str] = set()
            repo_summaries: List[GitHubRepoSummary] = []

            for repo in repos_data:
                lang = repo.get("language")
                if lang:
                    languages.append(lang)
                    detected_skills.add(lang)

                topics = repo.get("topics", [])
                for topic in topics:
                    detected_skills.add(topic.title())

                repo_tech_stack = extract_tech_stack_for_repo(repo)
                for t in repo_tech_stack:
                    detected_skills.add(t)

                repo_summaries.append(GitHubRepoSummary(
                    name=repo.get("name", ""),
                    description=repo.get("description"),
                    language=lang,
                    stars=repo.get("stargazers_count", 0),
                    forks=repo.get("forks_count", 0),
                    html_url=repo.get("html_url", ""),
                    topics=topics,
                    tech_stack=repo_tech_stack,
                    updated_at=repo.get("updated_at"),
                    is_fork=bool(repo.get("fork", False))
                ))

            # Calculate top languages ordered by occurrence
            lang_counts = Counter(languages)
            top_languages = [lang for lang, _ in lang_counts.most_common(6)]

            return GitHubSyncResponse(
                username=clean_username,
                name=user_data.get("name"),
                avatar_url=user_data.get("avatar_url"),
                bio=user_data.get("bio"),
                public_repos=user_data.get("public_repos", len(repo_summaries)),
                top_languages=top_languages,
                detected_skills=sorted(list(detected_skills))[:25],
                repositories=repo_summaries # All repositories returned!
            )

        except httpx.RequestError as e:
            logger.error(f"Error connecting to GitHub API for {clean_username}: {e}")
            return None
