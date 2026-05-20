import { createAnonClient, createServiceClient } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import SubscribeForm from "@/components/SubscribeForm";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function getFeaturedArticles() {
  const supabase = createAnonClient();
  // 只取最近 3 天的文章，优先最新
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) console.error("[getFeaturedArticles] error:", error);
  const articles = data || [];
  // 有图的排前面，无图的补后面
  const withImage = articles.filter((a) => a.image_url && a.image_url.startsWith("http"));
  const withoutImage = articles.filter((a) => !a.image_url || !a.image_url.startsWith("http"));
  return [...withImage, ...withoutImage].slice(0, 7);
}

async function getLatestArticles() {
  const supabase = createAnonClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);
  // 过滤：有图 + published_at 在14天内（或无 published_at）
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return (data || [])
    .filter((a) => {
      if (!a.image_url || !a.image_url.startsWith("http")) return false;
      if (a.published_at && new Date(a.published_at).getTime() < cutoff) return false;
      return true;
    })
    .slice(0, 4);
}

async function getTodayDigest() {
  const supabase = createServiceClient();
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

      {/* Hero — 左标题 + 右要点 */}
      <section className="border-b border-gray-100 bg-[#f8f7f4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* 左：标题 */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-950 leading-tight tracking-tight">
              今日<br />AI 精选
            </h1>
          </div>

          {/* 右：今日要点列表 */}
          {digest && digest.key_points && digest.key_points.length > 0 && (
            <div>
              {digest.key_points.map((point: string, i: number) => (
                <div key={i} className="flex gap-4 py-4 border-t border-gray-200 first:border-t-0">
                  <span className="text-xs text-gray-400 font-mono mt-0.5 w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <p>AI Newsletter · 每日精选 AI 资讯</p>
      </footer>
    </main>
  );
}
