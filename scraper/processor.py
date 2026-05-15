"""
Claude AI 处理器 — 批量生成中文摘要和分类
"""

import os
import time
import json
from typing import Optional
import anthropic
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

SYSTEM_PROMPT = """你是AI资讯编辑，专为中国AI从业者整理英文技术资讯。
对于用户提供的文章标题和摘要，请生成：
1. 中文摘要（80-100字，面向中国AI从业者，简洁专业）
2. 分类（从以下选一个：LLM / 视觉 / 工具 / 研究 / 应用）
3. 3个中文标签（简短关键词）

请严格返回以下 JSON 格式，不要有任何其他内容：
{
  "summary_zh": "中文摘要内容",
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"]
}"""


def analyze_article(client: anthropic.Anthropic, title: str, description: str = "") -> Optional[dict]:
    try:
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"标题：{title}\n摘要/描述：{description or '（无描述）'}",
                }
            ],
        )
        text = message.content[0].text if message.content else ""
        # 提取 JSON
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            return None
        return json.loads(text[start:end])
    except Exception as e:
        print(f"  [Claude] 分析失败: {e}")
        return None


def process_unanalyzed_articles(batch_size: int = 20):
    """查询未处理文章，批量调用 Claude，写回结果"""
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    ai_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # 查询 summary_zh IS NULL 的文章
    resp = (
        sb.table("articles")
        .select("id, title, url, source")
        .is_("summary_zh", "null")
        .order("created_at", desc=True)
        .limit(batch_size)
        .execute()
    )

    articles = resp.data or []
    if not articles:
        print("[Processor] 没有待处理的文章")
        return 0

    print(f"[Processor] 待处理文章：{len(articles)} 篇")
    processed = 0

    for i, article in enumerate(articles):
        print(f"  ({i+1}/{len(articles)}) {article['title'][:60]}...")
        result = analyze_article(ai_client, article["title"])
        if result:
            sb.table("articles").update(
                {
                    "summary_zh": result.get("summary_zh", ""),
                    "category": result.get("category", "研究"),
                    "tags": result.get("tags", []),
                }
            ).eq("id", article["id"]).execute()
            processed += 1
        # 避免触发速率限制
        time.sleep(0.5)

    print(f"[Processor] 完成，处理 {processed}/{len(articles)} 篇")
    return processed


if __name__ == "__main__":
    process_unanalyzed_articles()
