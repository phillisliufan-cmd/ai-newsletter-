"""
每日 AI 要点综合 — 用 Claude 把当天所有文章合成一份中文摘要报告
运行：python daily_digest.py
"""

import os
import json
from datetime import datetime, timezone, timedelta
from typing import Optional
import anthropic
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

DIGEST_PROMPT = """你是专业的 AI 领域分析师，请根据以下今日 AI 资讯，生成一份面向中国 AI 从业者的日报综合。

要求：
1. **今日要点**：用3-5个要点概括今天最重要的 AI 进展（每条50字以内，用动词开头）
2. **综合分析**：300字以内的分析，讲清楚今天发生了什么、有什么趋势、对行业意味着什么
3. 语言专业、简洁，不要废话，突出对中国 AI 从业者最有价值的信息

返回严格的 JSON 格式：
{
  "key_points": ["要点1", "要点2", "要点3", "要点4", "要点5"],
  "summary_zh": "综合分析内容..."
}

今日资讯列表：
"""


def generate_daily_digest(date: Optional[str] = None) -> Optional[dict]:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    today = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    # 查询今日文章
    resp = (
        sb.table("articles")
        .select("id, title, summary_zh, source, category")
        .eq("is_published", True)
        .gte("created_at", since)
        .not_.is_("summary_zh", "null")
        .order("score", desc=True)
        .limit(50)
        .execute()
    )

    articles = resp.data or []
    if len(articles) < 3:
        print(f"[Digest] 文章不足（{len(articles)}篇），跳过")
        return None

    print(f"[Digest] 基于 {len(articles)} 篇文章生成综合...")

    # 构建文章列表给 Claude
    articles_text = "\n".join([
        f"- [{a.get('category', '?')}] {a['title']}：{a.get('summary_zh', '')}"
        for a in articles
    ])

    try:
        msg = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": DIGEST_PROMPT + articles_text
            }]
        )
        text = msg.content[0].text
        start = text.find("{")
        end = text.rfind("}") + 1
        result = json.loads(text[start:end])
    except Exception as e:
        print(f"[Digest] Claude 调用失败: {e}")
        return None

    # 写入数据库
    article_ids = [a["id"] for a in articles]
    try:
        sb.table("daily_digests").upsert({
            "date": today,
            "summary_zh": result.get("summary_zh", ""),
            "key_points": result.get("key_points", []),
            "article_ids": article_ids,
        }, on_conflict="date").execute()
        print(f"[Digest] ✓ 已生成并保存 {today} 的综合")
        print("\n要点：")
        for kp in result.get("key_points", []):
            print(f"  • {kp}")
        print(f"\n分析：\n{result.get('summary_zh', '')}")
    except Exception as e:
        print(f"[Digest] 保存失败: {e}")
        return None

    return result


if __name__ == "__main__":
    generate_daily_digest()
