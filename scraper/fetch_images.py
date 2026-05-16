"""
从文章 URL 抓取 og:image，补充封面图
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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
TIMEOUT = 8


def fetch_og_image(url: str) -> Optional[str]:
    """抓取页面的 og:image 或 twitter:image"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")

        # 优先 og:image
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            img = og["content"].strip()
            if img.startswith("http"):
                return img

        # 备选 twitter:image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            img = tw["content"].strip()
            if img.startswith("http"):
                return img

        return None
    except Exception:
        return None


def fetch_missing_images(batch_size: int = 30):
    """查询没有 image_url 的文章，抓取 og:image 并写回"""
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    resp = (
        sb.table("articles")
        .select("id, url, source")
        .is_("image_url", "null")
        .order("created_at", desc=True)
        .limit(batch_size)
        .execute()
    )

    articles = resp.data or []
    if not articles:
        print("[Images] 没有缺图的文章")
        return 0

    # 跳过不太可能有 og:image 的来源
    skip_sources = {"hackernews", "arxiv", "reddit"}

    print(f"[Images] 待抓取：{len(articles)} 篇")
    found = 0

    for i, article in enumerate(articles):
        if article["source"] in skip_sources:
            continue

        print(f"  ({i+1}/{len(articles)}) {article['url'][:70]}...")
        img_url = fetch_og_image(article["url"])

        if img_url:
            sb.table("articles").update({"image_url": img_url}).eq("id", article["id"]).execute()
            print(f"    ✓ {img_url[:60]}...")
            found += 1
        else:
            # 标记为空字符串，避免反复重试
            sb.table("articles").update({"image_url": ""}).eq("id", article["id"]).execute()

        time.sleep(0.5)

    print(f"[Images] 完成，获取 {found} 张封面图")
    return found


if __name__ == "__main__":
    fetch_missing_images(batch_size=50)
