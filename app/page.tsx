import { createAnonClient } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import SubscribeForm from "@/components/SubscribeForm";
import Navbar from "@/components/Navbar";
import DailyDigest from "@/components/DailyDigest";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function getFeaturedArticles() {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("score", { ascending: false })
    .limit(7);
  if (error) console.error("[getFeaturedArticles] error:", error);
  return data || [];
}

async function getLatestArticles() {
  const supabase = createAnonClient();
  // 取最近文章，前端再过滤有图的
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);
  // 只保留有真实图片的
  return (data || []).filter((a) => a.image_url && a.image_url.startsWith("http")).slice(0, 4);
}

async function getTodayDigest() {
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("daily_digests")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return data || null;
}

export default async function HomePage() {
  const [articles, digest, latest] = await Promise.all([
    getFeaturedArticles(),
    getTodayDigest(),
    getLatestArticles(),
  ]);

  const [hero, ...rest] = articles;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50/40 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            每日更新 · Claude AI 驱动摘要
          </p>

          <h1 className="font-heading text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
            精选 AI 资讯<br />
            <span className="text-gradient">每日送达</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            自动聚合 Hacker News、arXiv、各大 AI 媒体最新动态，
            由 Claude AI 生成中文摘要，帮你高效跟踪 AI 前沿进展。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/browse" className="btn-primary text-base px-7 py-3">
              浏览全部资讯 →
            </Link>
            <Link href="/auth/register" className="btn-ghost text-base px-7 py-3">
              订阅每日精选
            </Link>
          </div>

          <div className="flex items-center justify-center gap-10 mt-12 text-sm text-gray-400">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-gray-800">15+</span>
              <span>数据来源</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-gray-800">每日</span>
              <span>自动更新</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-gray-800">5</span>
              <span>分类标签</span>
            </div>
          </div>
        </div>
      </section>

      {/* 今日 AI 要点 */}
      <DailyDigest digest={digest} />

      {/* 今日精选 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-gray-900">今日精选</h2>
            <p className="text-sm text-gray-400 mt-1">按热度排序的最新 AI 资讯</p>
          </div>
          <Link href="/browse" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            查看全部 →
          </Link>
        </div>

        {articles.length > 0 ? (
          <>
            {/* 大卡 + 两列小卡 布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
              {/* 大卡 */}
              {hero && (
                <div className="lg:col-span-3">
                  <ArticleCard article={hero} featured large />
                </div>
              )}
              {/* 右侧两张竖排 */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                {rest.slice(0, 2).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* 下方三列 */}
            {rest.length > 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {rest.slice(2, 6).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🤖</p>
            <p className="font-medium">数据库暂无内容，请先运行爬虫</p>
            <code className="mt-2 block text-xs text-gray-400">python scraper/main.py</code>
          </div>
        )}
      </section>

      {/* 最新配图文章 */}
      {latest.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-heading text-2xl font-bold text-gray-900">最新资讯</h2>
                <p className="text-sm text-gray-400 mt-1">来自 Newsletter 博主和 AI 媒体</p>
              </div>
              <Link href="/browse" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {latest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 来源展示 */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">数据来源</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400 font-medium">
            {["Hacker News", "arXiv", "Reddit", "OpenAI", "DeepMind", "HuggingFace", "VentureBeat", "TechCrunch", "The Verge", "MIT Tech Review", "Simon Willison", "TLDR AI"].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 订阅区 */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">订阅</p>
          <h2 className="font-heading text-3xl font-bold text-gray-900 mb-3">
            每日 AI 精选，直送邮箱
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            每天早上 9 点，精选10篇最新 AI 资讯，配中文摘要，5分钟了解AI前沿动态。
          </p>
          <div className="flex justify-center">
            <SubscribeForm />
          </div>
          <p className="text-xs text-gray-400 mt-4">无垃圾邮件，随时退订</p>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>AI Newsletter · 由 Claude API 驱动 · 数据来自 HackerNews / arXiv / Reddit 等15+来源</p>
      </footer>
    </main>
  );
}
