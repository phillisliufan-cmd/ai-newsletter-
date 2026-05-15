"""
Papers With Code 爬虫 — 使用官方 API
获取最新论文列表
"""

import requests
from datetime import datetime, timezone

PWC_API = "https://paperswithcode.com/api/v1/papers/"


def fetch_paperswithcode_articles(page_size: int = 30) -> list[dict]:
    """获取 Papers With Code 最新论文"""
    try:
        resp = requests.get(
            PWC_API,
            params={"page": 1, "items_per_page": page_size},
            headers={"User-Agent": "AI-Newsletter-Bot/1.0"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[PWC] 请求失败: {e}")
        return []

    papers = data.get("results", [])
    articles = []

    for paper in papers:
        title = paper.get("title", "").strip()
        url = paper.get("url_abs") or paper.get("url_pdf") or ""
        if not title or not url:
            continue

        # paperswithcode 链接可能是相对路径
        if url.startswith("/"):
            url = f"https://paperswithcode.com{url}"

        abstract = paper.get("abstract", "") or ""
        published = paper.get("published", "")

        articles.append(
            {
                "title": title,
                "url": url,
                "source": "paperswithcode",
                "score": 0,
                "published_at": published or None,
                "description": abstract[:300] if abstract else "",
            }
        )

    print(f"[PWC] 获取到 {len(articles)} 篇论文")
    return articles
