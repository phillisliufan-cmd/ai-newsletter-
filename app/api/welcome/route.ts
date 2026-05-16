import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const from = process.env.RESEND_FROM_EMAIL || 'AI Newsletter <onboarding@resend.dev>'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-newsletter-six-pi.vercel.app'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#ffffff;font-family:'Inter',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#111827;">

  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:22px;font-weight:800;color:#111827;">AI <span style="color:#2563eb;">Newsletter</span></span>
  </div>

  <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">欢迎订阅！🎉</h1>
  <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
    感谢你订阅 <strong>AI Newsletter</strong>。<br>
    从现在起，你将每天收到精选的 AI 前沿资讯，由 Claude AI 生成中文摘要，帮你在 5 分钟内掌握最重要的进展。
  </p>

  <div style="background:#f9fafb;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
    <p style="margin:0 0 10px;font-weight:600;color:#111827;font-size:14px;">你将收到：</p>
    <ul style="margin:0;padding-left:18px;color:#6b7280;font-size:14px;line-height:2;">
      <li>每日精选 10 篇 AI 资讯</li>
      <li>Claude AI 生成的中文摘要</li>
      <li>涵盖 LLM、视觉、工具、研究、应用 5 大分类</li>
      <li>来自 OpenAI、DeepMind、HN、arXiv 等 15+ 来源</li>
    </ul>
  </div>

  <div style="text-align:center;margin-bottom:28px;">
    <a href="${siteUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">
      立即浏览最新资讯 →
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:0;">
    AI Newsletter · 由 Claude API 驱动<br>
    你收到此邮件是因为刚刚订阅了 AI Newsletter。
  </p>

</body>
</html>`

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: '欢迎订阅 AI Newsletter！',
      html,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Welcome email]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
