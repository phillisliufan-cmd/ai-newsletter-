"""
爬虫主入口
运行：python main.py [--source hackernews|paperswithcode|github|reddit|arxiv|all]
"""

import os
import argparse
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client, Client
from sources.hackernews import fetch_hackernews_articles
from sources.paperswithcode import fetch_paperswithcode_articles
from sources.github_trending import fetch_github_trending_articles
from sources.reddit_ml import fetch_reddit_articles
from sources.arxiv_ai import fetch_arxiv_articles
from sources.ai_news_rss import fetch_ai_news_articles
from sources.newsletters import fetch_newsletter_articles
from processor import process_unanalyzed_articles
from daily_digest import generate_daily_digest
from fetch_images import fetch_missing_images

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]


def upsert_articles(sb: Client, articles: list[dict]) -> int:
    """写入文章，忽略 URL 冲突（已存在则跳过）"""
    if not articles:
        return 0

    rows = []
    for a in articles:
        rows.append({
            "title": a["title"],
            "url": a["url"],
            "source": a["source"],
            "score": a.get("score", 0),
            "published_at": a.get("published_at"),
        })

    try:
        resp = (
            sb.table("articles")
            .upsert(rows, on_conflict="url", ignore_duplicates=True)
            .execute()
        )
        return len(resp.data) if resp.data else 0
    except Exception as e:
        print(f"  [DB] 写入失败: {e}")
        return 0


def main():
    parser = argparse.ArgumentParser(description="AI Newsletter 爬虫")
    parser.add_argument(
        "--source",
        choices=["hackernews", "paperswithcode", "reddit", "arxiv", "news", "newsletters", "all"],
        default="all",
        help="指定爬取来源（默认 all）",
    )
    parser.add_argument(
        "--no-process",
        action="store_true",
        help="只爬取，不调用 Claude 处理",
    )
    args = parser.parse_args()

    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    total_inserted = 0

    if args.source in ("hackernews", "all"):
        print("\n=== HackerNews ===")
        articles = fetch_hackernews_articles(limit=200)
        n = upsert_articles(sb, articles)
        print(f"  写入 {n} 篇新文章")
        total_inserted += n

    if args.source in ("paperswithcode", "all"):
        print("\n=== Papers With Code ===")
        articles = fetch_paperswithcode_articles(page_size=30)
        n = upsert_articles(sb, articles)
        print(f"  写入 {n} 篇新文章")
        total_inserted += n

    if args.source in ("reddit", "all"):
        print("\n=== Reddit (r/MachineLearning + r/LocalLLaMA) ===")
        articles = fetch_reddit_articles(limit_per_sub=25)
        n = upsert_articles(sb, articles)
        print(f"  写入 {n} 篇新帖子")
        total_inserted += n

    if args.source in ("arxiv", "all"):
        print("\n=== arXiv (cs.AI / cs.LG / cs.CL / cs.CV) ===")
        articles = fetch_arxiv_articles(max_per_category=5)
        n = upsert_articles(sb, articles)
        print(f"  写入 {n} 篇新论文")
        total_inserted += n

    if args.source in ("news", "all"):
        print("\n=== AI 科技媒体 + 大模型公司博客 ===")
        articles = fetch_ai_news_articles(max_per_source=10)
        n = upsert_articles(sb, articles)
        print(f"  写入 {n} 篇新文章")
        total_inserted += n

    if args.source in ("newsletters", "all"):
        print("\n=== AI 博主 Newsletter ===")
        articles = fetch_newsletter_articles(max_per_source=8)
        n = upsert_articles(sb, articles)
        print(f"  写入 {n} 篇新文章")
        total_inserted += n

    print(f"\n总计写入 {total_inserted} 篇新内容")

    if not args.no_process:
        print("\n=== Claude AI 处理 ===")
        process_unanalyzed_articles(batch_size=20)

        print("\n=== 生成今日 AI 要点综合 ===")
        generate_daily_digest()

        print("\n=== 抓取文章封面图 ===")
        fetch_missing_images(batch_size=40)

    print("\n爬虫运行完成 ✓")


if __name__ == "__main__":
    main()
