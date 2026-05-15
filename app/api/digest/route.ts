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

  // 查询过去 24 小时已发布文章，按 score 取前 10
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .gte('created_at', since)
    .order('score', { ascending: false })
    .limit(10)

  if (articlesError) {
    return NextResponse.json({ error: articlesError.message }, { status: 500 })
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: '过去24小时没有新文章', sentCount: 0 })
  }

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
