"""
GitHub Trending 爬虫 — 爬取每日热门仓库
过滤含 AI/ML/LLM 关键词的仓库
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone

GITHUB_TRENDING_URL = "https://github.com/trending/python?since=daily"
AI_KEYWORDS = {
    "ai", "ml", "llm", "gpt", "claude", "neural", "machine learning",
    "deep learning", "transformer", "diffusion", "model", "agent",
    "openai", "anthropic", "embedding", "inference", "rag",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def _is_ai_related(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in AI_KEYWORDS)


def fetch_github_trending_articles() -> list[dict]:
    """爬取 GitHub Trending，返回 AI 相关仓库"""
    try:
        resp = requests.get(GITHUB_TRENDING_URL, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"[GitHub] 请求失败: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    repo_items = soup.select("article.Box-row")

    articles = []
    for item in repo_items:
        # 仓库路径
        h2 = item.select_one("h2.h3 a")
        if not h2:
            continue
        repo_path = h2.get("href", "").strip("/")
        if not repo_path:
            continue

        title = repo_path.replace("/", " / ")
        url = f"https://github.com/{repo_path}"

        # 描述
        desc_el = item.select_one("p.col-9")
        description = desc_el.get_text(strip=True) if desc_el else ""

        # 过滤
        if not _is_ai_related(title + " " + description):
            continue

        # 星数（热度）
        stars_el = item.select_one("a.Link--muted[href$='/stargazers']")
        stars_text = stars_el.get_text(strip=True).replace(",", "") if stars_el else "0"
        try:
            score = int(stars_text.replace("k", "000").replace(".", ""))
        except ValueError:
            score = 0

        articles.append(
            {
                "title": title,
                "url": url,
                "source": "github",
                "score": score,
                "published_at": datetime.now(tz=timezone.utc).isoformat(),
                "description": description,
            }
        )

    print(f"[GitHub] 找到 {len(articles)} 个 AI 相关仓库")
    return articles
