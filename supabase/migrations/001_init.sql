-- 文章表
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text unique not null,
  source text not null,           -- 'hackernews' | 'paperswithcode' | 'github'
  summary_zh text,                -- Claude 生成的中文摘要（100字以内）
  category text,                  -- 'LLM' | '视觉' | '工具' | '研究' | '应用'
  tags text[],
  score integer default 0,        -- 原始热度分
  published_at timestamptz,
  created_at timestamptz default now(),
  is_featured boolean default false,
  is_published boolean default true
);

-- 用户订阅偏好表（扩展 Supabase auth.users）
create table user_profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  preferred_categories text[] default array['LLM','工具','研究'],
  subscribed boolean default true,
  created_at timestamptz default now()
);

-- 邮件发送记录
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  sent_at timestamptz default now(),
  recipient_count integer,
  article_ids uuid[]
);

-- RLS 策略
alter table articles enable row level security;
alter table user_profiles enable row level security;

create policy "articles are publicly readable" on articles
  for select using (is_published = true);

create policy "users can read own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "users can update own profile" on user_profiles
  for update using (auth.uid() = id);

-- 服务端写入文章（供 Python 爬虫使用 service role）
create policy "service role can insert articles" on articles
  for insert with check (true);

create policy "service role can update articles" on articles
  for update using (true);

-- 自动创建用户 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
