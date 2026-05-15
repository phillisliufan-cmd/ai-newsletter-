# AI Newsletter — 每日 AI 资讯精选平台

自动聚合 Hacker News、Papers With Code、GitHub Trending 的最新 AI 动态，由 Claude AI 生成中文摘要，支持邮件订阅推送。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) + Tailwind CSS |
| 数据库/Auth | Supabase (Postgres + Auth) |
| AI 处理 | Anthropic Claude API (claude-haiku-4-5) |
| 邮件 | Resend |
| 爬虫 | Python 3.11+ |
| 部署 | Vercel (前端) + 本地/Railway (爬虫) |

## 项目结构

```
ai-newsletter/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页
│   ├── browse/page.tsx     # 浏览页（分类筛选）
│   ├── admin/page.tsx      # 后台管理
│   ├── auth/               # 登录 / 注册
│   └── api/                # API Routes
├── components/             # 复用组件
├── lib/                    # Supabase / Claude / Resend 封装
├── scraper/                # Python 爬虫
└── supabase/migrations/    # 数据库初始化 SQL
```

## 本地启动

### 1. 初始化 Supabase 数据库

1. 前往 [supabase.com](https://supabase.com) 创建项目
2. 进入 **SQL Editor**，粘贴并执行 `supabase/migrations/001_init.sql`
3. 在 **Project Settings → API** 中复制以下值：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入所有 key
```

所需 API Key：
- **Supabase**：见上方步骤
- **Anthropic**：[console.anthropic.com](https://console.anthropic.com)
- **Resend**：[resend.com](https://resend.com)（免费版支持 100封/天）

### 3. 启动 Next.js 前端

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

### 4. 安装 Python 爬虫依赖

```bash
cd scraper
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 scraper/.env，填入 SUPABASE_URL / SUPABASE_KEY / ANTHROPIC_API_KEY
```

## 手动触发爬虫

```bash
# 爬取所有来源 + Claude 处理（在项目根目录运行）
cd scraper && python main.py

# 只爬取指定来源
python main.py --source hackernews
python main.py --source paperswithcode
python main.py --source github

# 只爬取，不调用 Claude
python main.py --no-process
```

## 手动发送邮件摘要

```bash
curl -X POST http://localhost:3000/api/digest \
  -H "x-admin-email: your@email.com"
```

## 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 在 Vercel Dashboard → Settings → Environment Variables 中
# 添加 .env.local 中的所有变量
```

### 定时触发爬虫（crontab）

```cron
# 每天 UTC 00:00（北京时间 08:00）运行爬虫
0 0 * * * cd /path/to/ai-newsletter/scraper && source venv/bin/activate && python main.py >> ../scraper.log 2>&1
```

## 后台管理

访问 `/admin`（需使用 `ADMIN_EMAILS` 中配置的邮箱登录）：

- 文章上下架管理（toggle is_published）
- 用户订阅列表查看
- 一键发送今日摘要邮件

## 功能说明

### 数据来源
- **Hacker News**：官方 Firebase API，过滤含 AI/ML/LLM 关键词的热门文章
- **Papers With Code**：官方 API，最新 AI 论文
- **GitHub Trending**：爬取每日热门 AI 相关仓库

### AI 处理（claude-haiku-4-5）
每篇文章自动生成：
- 80-100 字中文摘要（面向 AI 从业者）
- 分类标签：LLM / 视觉 / 工具 / 研究 / 应用
- 3 个中文关键词标签

### 邮件推送
- 汇总过去 24 小时热度最高的 10 篇文章
- 深色风格 HTML 邮件，支持一键退订
