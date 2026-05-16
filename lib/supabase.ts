import { createClient } from '@supabase/supabase-js'

// 懒加载：避免在构建期间因缺少环境变量而崩溃
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

// 兼容性导出（客户端组件直接 import supabase 使用）
export const supabase = {
  auth: {
    signUp: (...args: Parameters<ReturnType<typeof createClient>['auth']['signUp']>) =>
      getSupabase().auth.signUp(...args),
    signInWithPassword: (...args: Parameters<ReturnType<typeof createClient>['auth']['signInWithPassword']>) =>
      getSupabase().auth.signInWithPassword(...args),
    signOut: () => getSupabase().auth.signOut(),
    getSession: () => getSupabase().auth.getSession(),
    onAuthStateChange: (...args: Parameters<ReturnType<typeof createClient>['auth']['onAuthStateChange']>) =>
      getSupabase().auth.onAuthStateChange(...args),
  },
  from: (table: string) => getSupabase().from(table),
}

// 服务端只读（Server Components，走 RLS）
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 服务端专用（API Routes，有完全权限）
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export type Article = {
  id: string
  title: string
  url: string
  source: string
  summary_zh: string | null
  category: string | null
  tags: string[] | null
  score: number
  published_at: string | null
  created_at: string
  is_featured: boolean
  is_published: boolean
  image_url: string | null
}

export type UserProfile = {
  id: string
  email: string
  preferred_categories: string[]
  subscribed: boolean
  created_at: string
}

export type EmailLog = {
  id: string
  sent_at: string
  recipient_count: number
  article_ids: string[]
}
