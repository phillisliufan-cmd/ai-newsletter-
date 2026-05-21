import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendDailyDigest } from '@/lib/resend'

export async function POST(request: NextRequest) {
  // 验证管理员身份（也可通过 cron secret）
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
  const adminEmail = request.headers.get('x-admin-email')

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (adminEmail && adminEmails.includes(adminEmail))

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 查询过去 48 小时已发布且有中文摘要的文章，多取一些再做多样性筛选
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: rawArticles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .gte('created_at', since)
    .not('summary_zh', 'is', null)
    .neq('summary_zh', '')
    .order('created_at', { ascending: false })
    .limit(80)

  if (articlesError) {
    return NextResponse.json({ error: articlesError.message }, { status: 500 })
  }

  if (!rawArticles || rawArticles.length === 0) {
    return NextResponse.json({ message: '过去48小时没有新文章', sentCount: 0 })
  }

  // 每个来源最多 2 篇，保证多样性，最终取 10 篇
  const sourceCount: Record<string, number> = {}
  const articles = rawArticles.filter((a) => {
    const count = sourceCount[a.source] || 0
    if (count >= 2) return false
    sourceCount[a.source] = count + 1
    return true
  }).slice(0, 10)

  // 获取所有订阅用户
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('subscribed', true)

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const recipients = (profiles || []).map((p) => p.email)

  const { success, sentCount, error: sendError } = await sendDailyDigest(articles, recipients)

  if (!success) {
    return NextResponse.json({ error: sendError }, { status: 500 })
  }

  // 记录到 email_logs
  await supabase.from('email_logs').insert({
    recipient_count: sentCount,
    article_ids: articles.map((a) => a.id),
  })

  return NextResponse.json({
    success: true,
    sentCount,
    articleCount: articles.length,
  })
}
