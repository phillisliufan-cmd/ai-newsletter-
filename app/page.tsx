import { createAnonClient } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import SubscribeForm from "@/components/SubscribeForm";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function getFeaturedArticles() {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("score", { ascending: false })
    .limit(6);
  if (error) console.error("[getFeaturedArticles] error:", error);
  return data || [];
}

export default async function HomePage() {
  const articles = await getFeaturedArticles();

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            每日更新 · Claude AI 驱动摘要
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
            精选 AI 资讯<br />
            <span className="text-gradient">每日送达</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            自动聚合 Hacker News、Papers With Code、GitHub Trending 最新动态，
            由 Claude AI 生成中文摘要，帮你高效跟踪 AI 前沿进展。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/browse" className="btn-primary text-base px-7 py-3">
              浏览项目 →
            </Link>
            <Link href="/auth/register" className="btn-ghost text-base px-7 py-3">
              订阅精选
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-gray-200">3</span>
              <span>数据来源</span>
            </div>
            <div className="w-px h-10 bg-gray-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-gray-200">每日</span>
              <span>自动更新</span>
            </div>
            <div className="w-px h-10 bg-gray-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-gray-200">5</span>
              <span>分类标签</span>
            </div>
          </div>
        </div>
      </section>

      {/* 今日精选 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-white">今日精选</h2>
          <Link href="/browse" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            查看全部 →
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} featured={i === 0} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-4">🤖</p>
            <p>数据库暂无内容，请先运行爬虫</p>
            <code className="mt-2 block text-xs text-gray-600">python scraper/main.py</code>
          </div>
        )}
      </section>

      {/* 订阅区 */}
      <section className="border-t border-gray-800 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-3">
            订阅每日 AI 精选
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            每天早上 9 点，精选10篇最新 AI 资讯直送邮箱，配中文摘要，5分钟了解AI前沿动态。
          </p>
          <div className="flex justify-center">
            <SubscribeForm />
          </div>
          <p className="text-xs text-gray-600 mt-4">无垃圾邮件，随时退订</p>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-xs text-gray-600">
        <p>AI Newsletter · 由 Claude API 驱动 · 数据来自 HackerNews / Papers With Code / GitHub</p>
      </footer>
    </main>
  );
}
