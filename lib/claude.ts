import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type ArticleAnalysis = {
  summary_zh: string
  category: 'LLM' | '视觉' | '工具' | '研究' | '应用'
  tags: string[]
}

const SYSTEM_PROMPT = `你是AI资讯编辑，专为中国AI从业者整理英文技术资讯。
对于用户提供的文章标题和摘要，请生成：
1. 中文摘要（80-100字，面向中国AI从业者，简洁专业）
2. 分类（从以下选一个：LLM / 视觉 / 工具 / 研究 / 应用）
3. 3个中文标签（简短关键词）

请严格返回以下 JSON 格式，不要有任何其他内容：
{
  "summary_zh": "中文摘要内容",
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"]
}`

export async function analyzeArticle(
  title: string,
  description: string = ''
): Promise<ArticleAnalysis | null> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `标题：${title}\n摘要/描述：${description || '（无描述）'}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as ArticleAnalysis
    return parsed
  } catch (err) {
    console.error('Claude analyzeArticle error:', err)
    return null
  }
}

// 批量处理，每次最多 20 条，返回 Map<index, result>
export async function analyzeArticlesBatch(
  articles: Array<{ title: string; description?: string }>
): Promise<Map<number, ArticleAnalysis>> {
  const results = new Map<number, ArticleAnalysis>()
  const batchSize = 20

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const promises = batch.map((article, j) =>
      analyzeArticle(article.title, article.description).then((result) => ({
        index: i + j,
        result,
      }))
    )
    const batchResults = await Promise.allSettled(promises)
    for (const settled of batchResults) {
      if (settled.status === 'fulfilled' && settled.value.result) {
        results.set(settled.value.index, settled.value.result)
      }
    }
    // 批次间休息 1 秒，避免速率限制
    if (i + batchSize < articles.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  return results
}
