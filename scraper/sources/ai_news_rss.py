"""
AI 科技媒体 + 大模型公司博客 RSS 爬虫
覆盖：OpenAI / Anthropic / Google DeepMind / Meta AI /
      VentureBeat / TechCrunch / The Verge / MIT Tech Review / HuggingFace
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional

HEADERS = {"User-Agent": "AI-Newsletter-Bot/1.0"}

RSS_SOURCES = [
    # === 大模型公司官方博客 ===
    {"url": "https://openai.com/blog/rss.xml",                                       "source": "openai",      "label": "OpenAI Blog"},
    {"url": "https://deepmind.google/blog/rss.xml",                                  "source": "deepmind",    "label": "DeepMind Blog"},
    {"url": "https://huggingface.co/blog/feed.xml",                                  "source": "huggingface", "label": "HuggingFace Blog"},
    {"url": "https://blogs.microsoft.com/ai/feed/",                                  "source": "microsoft",   "label": "Microsoft AI Blog"},
    {"url": "https://ai.meta.com/blog/rss/",                                         "source": "meta_ai",     "label": "Meta AI Blog"},
    {"url": "https://blog.google/technology/ai/rss/",                                "source": "google_ai",   "label": "Google AI Blog"},
    {"url": "https://www.anthropic.com/rss.xml",                                     "source": "anthropic",   "label": "Anthropic Blog"},

    # === 科技媒体 AI 频道 ===
    {"url": "https://venturebeat.com/category/ai/feed/",                             "source": "venturebeat", "label": "VentureBeat AI"},
    {"url": "https://techcrunch.com/category/artificial-intelligence/feed/",         "source": "techcrunch",  "label": "TechCrunch AI"},
    {"url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",     "source": "theverge",    "label": "The Verge AI"},
    {"url": "https://feeds.arstechnica.com/arstechnica/index.xml",                   "source": "arstechnica", "label": "Ars Technica"},
    {"url": "https://feeds.feedburner.com/ndtv/BqmB",                               "source": "wired_ai",    "label": "Wired AI"},

    # === 财经 & AI 公司动态 ===
    {"url": "https://feeds.reuters.com/reuters/technologyNews",                      "source": "reuters",     "label": "Reuters Technology"},
    {"url": "https://www.cnbc.com/id/19854910/device/rss/rss.html",                 "source": "cnbc",        "label": "CNBC Technology"},
    {"url": "https://finance.yahoo.com/rss/headline?s=NVDA",                        "source": "yahoo_fin",   "label": "Yahoo Finance NVDA"},
    {"url": "https://finance.yahoo.com/rss/headline?s=MSFT",                        "source": "yahoo_fin",   "label": "Yahoo Finance MSFT"},
    {"url": "https://finance.yahoo.com/rss/headline?s=GOOGL",                       "source": "yahoo_fin",   "label": "Yahoo Finance GOOGL"},
    {"url": "https://finance.yahoo.com/rss/headline?s=META",                        "source": "yahoo_fin",   "label": "Yahoo Finance META"},
    {"url": "https://finance.yahoo.com/rss/headline?s=AMD",                         "source": "yahoo_fin",   "label": "Yahoo Finance AMD"},
]

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "media": "http://search.yahoo.com/mrss/",
}


def _parse_date(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    try:
        # RSS 格式 (RFC 2822)
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        # ISO 8601
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).isoformat()
    except Exception:
        return None


def _fetch_rss(feed_url: str, source_key: str, label: str, max_items: int = 15) -> list[dict]:
    try:
        resp = requests.get(feed_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"  [{label}] 请求失败: {e}")
        return []

    articles = []

    # 支持 RSS 2.0 和 Atom 格式
    # RSS 2.0
    items = root.findall(".//item")
    for item in items[:max_items]:
        title_el = item.find("title")
        link_el = item.find("link")
        desc_el = item.find("description")
        date_el = item.find("pubDate") or item.find("dc:date")

        title = title_el.text.strip() if title_el is not None and title_el.text else ""
        link = link_el.text.strip() if link_el is not None and link_el.text else ""
        desc = desc_el.text or "" if desc_el is not None else ""
        # 去掉 HTML 标签
        import re
        desc = re.sub(r"<[^>]+>", "", desc).strip()[:300]
        date_str = date_el.text if date_el is not None else None

        if not title or not link:
            continue

        articles.append({
            "title": title,
            "url": link,
            "source": source_key,
            "score": 0,
            "published_at": _parse_date(date_str) if date_str else None,
            "description": desc,
        })

    # Atom 格式
    if not articles:
        entries = root.findall("atom:entry", NS)
        for entry in entries[:max_items]:
            title_el = entry.find("atom:title", NS)
            link_el = entry.find("atom:link", NS)
            summary_el = entry.find("atom:summary", NS)
            date_el = entry.find("atom:published", NS) or entry.find("atom:updated", NS)

            title = title_el.text.strip() if title_el is not None and title_el.text else ""
            link = link_el.get("href", "") if link_el is not None else ""
            desc = summary_el.text or "" if summary_el is not None else ""
            import re
            desc = re.sub(r"<[^>]+>", "", desc).strip()[:300]
            date_str = date_el.text if date_el is not None else None

            if not title or not link:
                continue

            articles.append({
                "title": title,
                "url": link,
                "source": source_key,
                "score": 0,
                "published_at": _parse_date(date_str) if date_str else None,
                "description": desc,
            })

    return articles


def fetch_ai_news_articles(max_per_source: int = 10) -> list[dict]:
    all_articles = []
    for feed in RSS_SOURCES:
        items = _fetch_rss(feed["url"], feed["source"], feed["label"], max_per_source)
        print(f"  [{feed['label']}] {len(items)} 篇")
        all_articles.extend(items)

    print(f"[AI News RSS] 共获取 {len(all_articles)} 篇")
    return all_articles
