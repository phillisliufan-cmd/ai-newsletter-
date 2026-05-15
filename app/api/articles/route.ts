import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// GET /api/articles?category=LLM&source=hackernews&limit=20&offset=0
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const source = searchParams.get('source')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const featured = searchParams.get('featured')

  const supabase = createServiceClient()

  let query = supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq('category', category)
  if (source) query = query.eq('source', source)
  if (featured === 'true') query = query.eq('is_featured', true)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ articles: data, total: count })
}

// POST /api/articles — 管理员创建文章
export async function POST(request: NextRequest) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
  const authHeader = request.headers.get('x-admin-email')

  if (!authHeader || !adminEmails.includes(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase.from('articles').insert(body).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ article: data }, { status: 201 })
}

// PATCH /api/articles — 管理员更新文章
export async function PATCH(request: NextRequest) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
  const authHeader = request.headers.get('x-admin-email')

  if (!authHeader || !adminEmails.includes(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing article id' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ article: data })
}
