import { Resend } from 'resend'
import { Article } from './supabase'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 懒加载避免构建期缺少环境变量时报错
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'digest@yourdomain.com'
}

const SOURCE_LABELS: Record<string, string> = {
  hackernews: 'Hacker News',
  paperswithcode: 'Papers With Code',
  github: 'GitHub Trending',
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
      const tags = (a.tags || []).map((t) => `<span style="background:#1f2937;color:#9ca3af;padding:2px 8px;border-radius:4px;font-size:12px;margin-right:4px;">${t}</span>`).join('')
      return `
      <div style="border:1px solid #1f2937;border-radius:12px;padding:20px;margin-bottom:16px;background:#111827;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="background:${categoryColor};color:#fff;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;">${a.category || '未分类'}</span>
          <span style="color:#6b7280;font-size:12px;">${SOURCE_LABELS[a.source] || a.source}</span>
          ${a.score > 0 ? `<span style="color:#6b7280;font-size:12px;">热度 ${a.score}</span>` : ''}
        </div>
        <a href="${a.url}" style="color:#7c3aed;font-size:16px;font-weight:600;text-decoration:none;line-height:1.4;">${a.title}</a>
        <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:10px 0;">${a.summary_zh || '暂无摘要'}</p>
        <div style="margin-top:8px;">${tags}</div>
      </div>`
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>今日AI精选</title></head>
<body style="background:#0a0a0a;color:#e5e7eb;font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:32px 0 24px;">
    <h1 style="font-size:28px;font-weight:800;color:#fff;margin:0;">
      今日AI精选 · <span style="color:#7c3aed;">${date}</span>
    </h1>
    <p style="color:#6b7280;margin-top:8px;">精选 ${articles.length} 篇 AI 资讯，为你节省信息筛选时间</p>
  </div>
  <hr style="border-color:#1f2937;margin-bottom:24px;">
  ${articleItems}
  <hr style="border-color:#1f2937;margin-top:24px;">
  <p style="text-align:center;color:#4b5563;font-size:12px;padding:16px 0;">
    你收到此邮件是因为订阅了 AI Newsletter。
    <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unsubscribe?email={{email}}" style="color:#7c3aed;">退订</a>
  </p>
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
