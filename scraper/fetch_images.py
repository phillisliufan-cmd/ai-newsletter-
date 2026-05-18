"""
给文章配封面图：
1. 媒体文章优先抓 og:image
2. 其余（HN/Reddit/arXiv）用 Unsplash API 按分类搜图
"""

import os
import time
import requests
from bs4 import BeautifulSoup
from typing import Optional
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
UNSPLASH_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
TIMEOUT = 8

# 每个分类对应的 Unsplash 搜索词
CATEGORY_QUERIES = {
    "LLM":  "artificial intelligence neural network",
    "视觉":  "computer vision deep learning",
    "工具":  "software developer technology",
    "研究":  "science research laboratory data",
    "应用":  "technology application innovation",
}

SOURCE_QUERIES = {
    "hackernews":  "technology programming",
    "reddit":      "technology community discussion",
    "arxiv":       "academic research science paper",
    "paperswithcode": "machine learning research",
}

# 缓存：同一 query 只请求一次，轮换使用不同图片
_unsplash_cache: dict[str, list[str]] = {}
_unsplash_index: dict[str, int] = {}


def picsum_fallback(article_id: str) -> str:
    """用 picsum.photos 随机图，按 id 固定，同一文章每次相同"""
    seed = abs(hash(article_id)) % 1000
    return f"https://picsum.photos/seed/{seed}/800/450"


def unsplash_search(query: str) -> Optional[str]:
    """用 Unsplash API 搜索图片，轮换返回不同结果"""
    if not UNSPLASH_KEY:
        return None

    if query not in _unsplash_cache:
        try:
            resp = requests.get(
                "https://api.unsplash.com/search/photos",
                params={"query": query, "per_page": 20, "orientation": "landscape"},
                headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
                timeout=TIMEOUT,
            )
            if resp.status_code != 200:
                return None
            results = resp.json().get("results", [])
            urls = [r["urls"]["regular"] for r in results if r.get("urls")]
            _unsplash_cache[query] = urls
            _unsplash_index[query] = 0
        except Exception as e:
            print(f"  [Unsplash] 请求失败: {e}")
            return None

    urls = _unsplash_cache.get(query, [])
    if not urls:
        return None

    idx = _unsplash_index.get(query, 0)
    url = urls[idx % len(urls)]
    _unsplash_index[query] = idx + 1
    return url


def fetch_og_image(url: str) -> Optional[str]:
    """抓取页面的 og:image 或 twitter:image"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")

        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            img = og["content"].strip()
            if img.startswith("http"):
                return img

        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            img = tw["content"].strip()
            if img.startswith("http"):
                return img

        return None
    except Exception:
        return None


def get_image_for_article(article: dict) -> Optional[str]:
    """
    策略：
    - 媒体/博客来源 → 优先 og:image，失败再用 Unsplash
    - HN/Reddit/arXiv → 直接用 Unsplash
    """
    source = article.get("source", "")
    category = article.get("category") or ""
    tags = article.get("tags") or []

    og_sources = {"openai", "deepmind", "huggingface", "microsoft",
                  "venturebeat", "techcrunch", "theverge", "mit_review",
                  "arstechnica", "simon_willison", "tldr_ai", "import_ai",
                  "ai_news", "ai_edge", "bens_bites", "deeplearning_ai", "rundown_ai"}

    img = None

    # 尝试 og:image
    if source in og_sources:
        img = fetch_og_image(article["url"])

    # 没拿到 → 用 Unsplash
    if not img:
        query = (
            CATEGORY_QUERIES.get(category)
            or SOURCE_QUERIES.get(source)
            or (tags[0] + " artificial intelligence" if tags else "artificial intelligence technology")
        )
        img = unsplash_search(query)

    # 最后兜底 → picsum 随机图
    if not img:
        img = picsum_fallback(article.get("id", article.get("url", "")))

    return img


def fetch_missing_images(batch_size: int = 50):
    """查询没有 image_url 的文章，配图后写回"""
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    resp = (
        sb.table("articles")
        .select("id, url, source, category, tags")
        .or_("image_url.is.null,image_url.eq.")
        .order("created_at", desc=True)
        .limit(batch_size)
        .execute()
    )

    articles = resp.data or []
    if not articles:
        print("[Images] 没有缺图的文章")
        return 0

    print(f"[Images] 待配图：{len(articles)} 篇")
    found = 0

    for i, article in enumerate(articles):
        print(f"  ({i+1}/{len(articles)}) {article['url'][:65]}...")
        img_url = get_image_for_article(article)

        if img_url:
            sb.table("articles").update({"image_url": img_url}).eq("id", article["id"]).execute()
            print(f"    ✓ 已配图")
            found += 1
        else:
            sb.table("articles").update({"image_url": ""}).eq("id", article["id"]).execute()

        time.sleep(0.3)

    print(f"[Images] 完成，配图 {found}/{len(articles)} 篇")
    return found


if __name__ == "__main__":
    fetch_missing_images(batch_size=50)
