import { Article } from './supabase'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const SOURCE_LABELS: Record<string, string> = {
  hackernews: 'Hacker News',
  paperswithcode: 'Papers With Code',
  github: 'GitHub Trending',
  openai: 'OpenAI',
  deepmind: 'DeepMind',
  huggingface: 'HuggingFace',
  microsoft: 'Microsoft AI',
  venturebeat: 'VentureBeat',
  techcrunch: 'TechCrunch',
  theverge: 'The Verge',
  mit_review: 'MIT Tech Review',
  arstechnica: 'Ars Technica',
  simon_willison: 'Simon Willison',
  tldr_ai: 'TLDR AI',
  import_ai: 'Import AI',
  ai_news: 'AI News',
  arxiv: 'arXiv',
}

const CATEGORY_COLORS: Record<string, string> = {
  LLM: '#7c3aed',
  视觉: '#0891b2',
  工具: '#059669',
  研究: '#d97706',
  应用: '#dc2626',
}

function buildEmailHtml(articles: Article[], date: string): string {
  const articleItems = articles
    .map((a) => {
      const categoryColor = CATEGORY_COLORS[a.category || ''] || '#6b7280'
      const sourceLabel = SOURCE_LABELS[a.source] || a.source
      const image = a.image_url && a.image_url.startsWith('http')
        ? `<img src="${a.image_url}" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:8px;margin-bottom:14px;display:block;">`
        : ''
      return `
      <div style="border-bottom:1px solid #e5e7eb;padding:24px 0;">
        ${image}
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="background:${categoryColor}18;color:${categoryColor};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.5px;">${a.category || '资讯'}</span>
          <span style="color:#9ca3af;font-size:12px;">${sourceLabel}</span>
        </div>
        <a href="${a.url}" style="color:#111827;font-size:17px;font-weight:700;text-decoration:none;line-height:1.4;display:block;margin-bottom:8px;">${a.title}</a>
        <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 12px;">${a.summary_zh || '暂无摘要'}</p>
        <a href="${a.url}" style="color:#2563eb;font-size:13px;font-weight:500;text-decoration:none;">阅读原文 →</a>
      </div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>今日AI精选</title></head>
<body style="background:#f9fafb;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- 顶部 header -->
    <div style="background:#ffffff;padding:32px 40px 20px;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.5px;">AI Newsletter</div>
      <div style="font-size:13px;color:#9ca3af;margin-top:4px;">${date} · 每日精选 AI 资讯</div>
    </div>

    <!-- 文章列表 -->
    <div style="padding:8px 40px 24px;">
      ${articleItems}
    </div>

    <!-- 底部 footer -->
    <div style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
        你收到此邮件是因为订阅了 AI Newsletter<br>
        <a href="https://ai-newsletter-six-pi.vercel.app" style="color:#2563eb;text-decoration:none;">访问网站</a>
        &nbsp;·&nbsp;
        <a href="https://ai-newsletter-six-pi.vercel.app" style="color:#9ca3af;text-decoration:none;">退订</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

export async function sendDailyDigest(
  articles: Article[],
  recipients: string[]
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  if (recipients.length === 0) {
    return { success: true, sentCount: 0 }
  }

  const dateStr = format(new Date(), 'M月d日', { locale: zhCN })
  const html = buildEmailHtml(articles, dateStr)

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    let sentCount = 0
    for (const to of recipients) {
      await transporter.sendMail({
        from: `AI Newsletter <${process.env.GMAIL_USER}>`,
        to,
        subject: `今日AI精选 · ${dateStr}`,
        html,
      })
      sentCount++
    }

    return { success: true, sentCount }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, sentCount: 0, error: message }
  }
}
