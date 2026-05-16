"""
顶级 AI 博主 Newsletter / 博客 RSS
"""

import requests
import xml.etree.ElementTree as ET
import re
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from typing import Optional

HEADERS = {"User-Agent": "AI-Newsletter-Bot/1.0"}

NEWSLETTER_SOURCES = [
    {"url": "https://simonwillison.net/atom/everything/",       "source": "simon_willison", "label": "Simon Willison"},
    {"url": "https://www.therundown.ai/rss",                    "source": "rundown_ai",     "label": "The Rundown AI"},
    {"url": "https://tldr.tech/api/rss/ai",                     "source": "tldr_ai",        "label": "TLDR AI"},
    {"url": "https://jack-clark.net/feed/",                     "source": "import_ai",      "label": "Import AI"},
    {"url": "https://bensbites.beehiiv.com/feed",               "source": "bens_bites",     "label": "Ben's Bites"},
    {"url": "https://www.deeplearning.ai/the-batch/feed/",      "source": "deeplearning_ai","label": "DeepLearning.AI"},
    {"url": "https://artificialintelligence-news.com/feed/",    "source": "ai_news",        "label": "AI News"},
    {"url": "https://newsletter.theaiedge.io/feed",             "source": "ai_edge",        "label": "The AI Edge"},
]

NS = {"atom": "http://www.w3.org/2005/Atom"}


def _clean(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def _parse_date(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    try:
        return parsedate_to_datetime(s).astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        from datetime import datetime
        return datetime.fromisoformat(s.replace("Z", "+00:00")).isoformat()
    except Exception:
        return None


def _parse_feed(url: str, source: str, label: str, max_items: int) -> list[dict]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"  [{label}] 失败: {e}")
        return []

    results = []

    # RSS 2.0
    for item in root.findall(".//item")[:max_items]:
        title = _clean(item.findtext("title") or "")
        link = _clean(item.findtext("link") or "")
        desc = _clean(item.findtext("description") or "")[:400]
        date = _parse_date(item.findtext("pubDate"))
        if title and link:
            results.append({"title": title, "url": link, "source": source,
                            "score": 0, "published_at": date, "description": desc})

    # Atom
    if not results:
        for entry in root.findall("atom:entry", NS)[:max_items]:
            title_el = entry.find("atom:title", NS)
            link_el = entry.find("atom:link", NS)
            summary_el = entry.find("atom:summary", NS)
            date_el = entry.find("atom:published", NS) or entry.find("atom:updated", NS)
            title = _clean(title_el.text if title_el is not None else "")
            link = (link_el.get("href", "") if link_el is not None else "")
            desc = _clean(summary_el.text if summary_el is not None else "")[:400]
            date = _parse_date(date_el.text if date_el is not None else None)
            if title and link:
                results.append({"title": title, "url": link, "source": source,
                                "score": 0, "published_at": date, "description": desc})

    return results


def fetch_newsletter_articles(max_per_source: int = 8) -> list[dict]:
    all_articles = []
    # 只保留 30 天内的文章
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    for feed in NEWSLETTER_SOURCES:
        items = _parse_feed(feed["url"], feed["source"], feed["label"], max_per_source)
        fresh = []
        for a in items:
            if a.get("published_at"):
                try:
                    pub = datetime.fromisoformat(a["published_at"])
                    if pub < cutoff:
                        continue
                except Exception:
                    pass
            fresh.append(a)
        print(f"  [{feed['label']}] {len(fresh)} 篇（过滤后）")
        all_articles.extend(fresh)
    print(f"[Newsletters] 共获取 {len(all_articles)} 篇")
    return all_articles
