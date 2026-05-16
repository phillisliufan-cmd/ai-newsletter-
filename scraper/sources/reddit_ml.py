"""
Reddit r/MachineLearning 爬虫
使用 Reddit 官方 JSON API（无需 API key）
"""

import requests
from datetime import datetime, timezone

SUBREDDITS = ["MachineLearning", "LocalLLaMA", "artificial"]
HEADERS = {"User-Agent": "AI-Newsletter-Bot/1.0 (research tool)"}
AI_KEYWORDS = {
    "ai", "ml", "llm", "gpt", "claude", "model", "neural", "transformer",
    "diffusion", "agent", "fine-tun", "rag", "inference", "benchmark",
    "multimodal", "paper", "research", "dataset", "training", "openai",
    "anthropic", "gemini", "mistral", "llama", "vision",
}


def _is_ai_related(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in AI_KEYWORDS)


def fetch_reddit_articles(limit_per_sub: int = 25) -> list[dict]:
    articles = []

    for subreddit in SUBREDDITS:
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit_per_sub}"
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"  [Reddit] r/{subreddit} 请求失败: {e}")
            continue

        posts = data.get("data", {}).get("children", [])
        for post in posts:
            p = post.get("data", {})
            title = p.get("title", "").strip()
            # 优先使用外链，其次用 Reddit 帖子链接
            url_raw = p.get("url", "")
            permalink = "https://www.reddit.com" + p.get("permalink", "")
            # 如果是 Reddit 内部链接，用 permalink
            if "reddit.com" in url_raw or url_raw.startswith("/"):
                url_final = permalink
            else:
                url_final = url_raw

            if not title or not url_final:
                continue

            # 过滤掉链接到 GitHub 仓库、HuggingFace 模型页、arXiv PDF 的帖子
            skip_domains = ("github.com", "huggingface.co/", "arxiv.org/pdf", "youtu.be", "youtube.com")
            if any(d in url_final for d in skip_domains):
                continue

            # r/MachineLearning 本身都是 AI 内容，其他子版块需过滤
            if subreddit != "MachineLearning" and not _is_ai_related(title):
                continue

            score = p.get("score", 0)
            created_ts = p.get("created_utc", 0)
            published_at = (
                datetime.fromtimestamp(created_ts, tz=timezone.utc).isoformat()
                if created_ts else None
            )
            description = p.get("selftext", "")[:300] if p.get("selftext") else ""

            articles.append({
                "title": title,
                "url": url_final,
                "source": "reddit",
                "score": score,
                "published_at": published_at,
                "description": description,
            })

    print(f"[Reddit] 获取到 {len(articles)} 篇帖子")
    return articles
