"""
arXiv AI 论文爬虫
使用 arXiv 官方 Atom API，抓取最新 cs.AI / cs.LG / cs.CL 论文
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ARXIV_API = "https://export.arxiv.org/api/query"
CATEGORIES = [
    "cs.AI",   # 人工智能
    "cs.LG",   # 机器学习
    "cs.CL",   # 计算语言学 / NLP
    "cs.CV",   # 计算机视觉
]
NS = {"atom": "http://www.w3.org/2005/Atom"}


def fetch_arxiv_articles(max_per_category: int = 10) -> list[dict]:
    articles = []
    seen_urls = set()

    for category in CATEGORIES:
        try:
            resp = requests.get(
                ARXIV_API,
                params={
                    "search_query": f"cat:{category}",
                    "sortBy": "submittedDate",
                    "sortOrder": "descending",
                    "max_results": max_per_category,
                },
                timeout=15,
            )
            resp.raise_for_status()
            root = ET.fromstring(resp.text)
        except Exception as e:
            print(f"  [arXiv] {category} 请求失败: {e}")
            continue

        entries = root.findall("atom:entry", NS)
        for entry in entries:
            title_el = entry.find("atom:title", NS)
            summary_el = entry.find("atom:summary", NS)
            id_el = entry.find("atom:id", NS)
            published_el = entry.find("atom:published", NS)

            title = title_el.text.strip().replace("\n", " ") if title_el is not None else ""
            abstract = summary_el.text.strip().replace("\n", " ") if summary_el is not None else ""
            arxiv_id = id_el.text.strip() if id_el is not None else ""
            published = published_el.text.strip() if published_el is not None else None

            if not title or not arxiv_id or arxiv_id in seen_urls:
                continue

            seen_urls.add(arxiv_id)
            # 转为 abs 页面链接
            url = arxiv_id.replace("http://", "https://")

            articles.append({
                "title": title,
                "url": url,
                "source": "arxiv",
                "score": 0,
                "published_at": published,
                "description": abstract[:400],
            })

    print(f"[arXiv] 获取到 {len(articles)} 篇论文")
    return articles
