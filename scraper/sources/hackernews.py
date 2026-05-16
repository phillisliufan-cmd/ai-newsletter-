"""
HackerNews 爬虫 — 使用官方 Firebase API
获取 top stories，过滤含 AI/ML 关键词的文章
"""

import requests
from typing import Optional
from datetime import datetime, timezone

HN_BASE = "https://hacker-news.firebaseio.com/v0"
AI_KEYWORDS = {
    "ai", "ml", "llm", "gpt", "claude", "model", "neural", "machine learning",
    "deep learning", "transformer", "diffusion", "embedding", "inference",
    "fine-tun", "rag", "agent", "openai", "anthropic", "gemini", "mistral",
    "llama", "benchmark", "multimodal", "vision model",
}


def _is_ai_related(title: str) -> bool:
    title_lower = title.lower()
    return any(kw in title_lower for kw in AI_KEYWORDS)


def fetch_item(item_id: int) -> Optional[dict]:
    try:
        resp = requests.get(f"{HN_BASE}/item/{item_id}.json", timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def fetch_hackernews_articles(limit: int = 200) -> list[dict]:
    """获取 HackerNews top stories 前 limit 条，过滤 AI 相关"""
    try:
        resp = requests.get(f"{HN_BASE}/topstories.json", timeout=15)
        resp.raise_for_status()
        top_ids: list[int] = resp.json()[:limit]
    except Exception as e:
        print(f"[HN] 获取 top stories 失败: {e}")
        return []

    articles = []
    for item_id in top_ids:
        item = fetch_item(item_id)
        if not item:
            continue
        if item.get("type") != "story":
            continue
        title = item.get("title", "")
        url = item.get("url", "")
        if not url or not _is_ai_related(title):
            continue

        published_ts = item.get("time")
        published_at = (
            datetime.fromtimestamp(published_ts, tz=timezone.utc).isoformat()
            if published_ts
            else None
        )

        articles.append(
            {
                "title": title,
                "url": url,
                "source": "hackernews",
                "score": item.get("score", 0),
                "published_at": published_at,
                "description": "",
            }
        )

    print(f"[HN] 找到 {len(articles)} 篇 AI 相关文章")
    return articles
