"use client";

import { useEffect, useState, useCallback } from "react";
import ArticleCard from "@/components/ArticleCard";
import CategoryFilter from "@/components/CategoryFilter";
import Navbar from "@/components/Navbar";
import { Article } from "@/lib/supabase";

const PAGE_SIZE = 18;

export default function BrowsePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchArticles = useCallback(
    async (reset: boolean = false) => {
      const currentOffset = reset ? 0 : offset;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(currentOffset),
      });
      if (category) params.set("category", category);
      if (source) params.set("source", source);

      const res = await fetch(`/api/articles?${params}`);
      const json = await res.json();
      const newArticles: Article[] = json.articles || [];

      if (reset) {
        setArticles(newArticles);
        setOffset(PAGE_SIZE);
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
        setOffset((prev) => prev + PAGE_SIZE);
      }

      setHasMore(newArticles.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [category, source, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchArticles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, source]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-1">浏览 AI 资讯</h1>
          <p className="text-gray-400 text-sm">来自 15+ 来源的最新 AI 动态，由 Claude AI 生成中文摘要</p>
        </div>

        {/* 过滤器 */}
        <div className="mb-8">
          <CategoryFilter
            selectedCategory={category}
            selectedSource={source}
            onCategoryChange={setCategory}
            onSourceChange={setSource}
          />
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm animate-pulse">
                <div className="h-32 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-5 bg-gray-100 rounded" />
                  <div className="h-5 bg-gray-100 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-medium text-gray-500">该分类暂无内容</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => fetchArticles(false)}
                  disabled={loadingMore}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "加载中…" : "加载更多"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
