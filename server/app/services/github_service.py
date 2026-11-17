import httpx
import logging
from typing import Optional, List, Dict
from collections import Counter
from app.models.profile import GitHubSyncResponse, GitHubRepoSummary

logger = logging.getLogger("studentpulse.github")

async def fetch_github_profile(username: str) -> Optional[GitHubSyncResponse]:
    """
    Fetches public profile and top repositories for a GitHub user.
    Extracts detected languages and technologies.
    """
    clean_username = username.strip().lstrip("@")
    if not clean_username:
        return None

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "StudentPulse-AI-Platform"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
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

            # 2. Fetch top repositories
            repos_res = await client.get(
                f"https://api.github.com/users/{clean_username}/repos?per_page=15&sort=updated",
                headers=headers
            )
            
            repos_data = repos_res.json() if repos_res.status_code == 200 else []

            # 3. Analyze languages and topics
            languages = []
            detected_skills = set()
            repo_summaries: List[GitHubRepoSummary] = []

            for repo in repos_data:
                # Exclude forks if desired, or include them
                lang = repo.get("language")
                if lang:
                    languages.append(lang)
                    detected_skills.add(lang)

                topics = repo.get("topics", [])
                for topic in topics:
                    detected_skills.add(topic.title())

                repo_summaries.append(GitHubRepoSummary(
                    name=repo.get("name", ""),
                    description=repo.get("description"),
                    language=lang,
                    stars=repo.get("stargazers_count", 0),
                    forks=repo.get("forks_count", 0),
                    html_url=repo.get("html_url", ""),
                    topics=topics
                ))

            # Calculate top languages ordered by occurrence
            lang_counts = Counter(languages)
            top_languages = [lang for lang, _ in lang_counts.most_common(5)]

            return GitHubSyncResponse(
                username=clean_username,
                name=user_data.get("name"),
                avatar_url=user_data.get("avatar_url"),
                bio=user_data.get("bio"),
                public_repos=user_data.get("public_repos", 0),
                top_languages=top_languages,
                detected_skills=list(detected_skills)[:12],
                repositories=repo_summaries[:6]
            )

        except httpx.RequestError as e:
            logger.error(f"Error connecting to GitHub API for {clean_username}: {e}")
            return None
