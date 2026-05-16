"use client";

import { useEffect, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import Navbar from "@/components/Navbar";
import { Article } from "@/lib/supabase";

const SOURCE_LABELS: Record<string, string> = {
  hackernews:     "Hacker News",
  reddit:         "Reddit",
  arxiv:          "arXiv 论文",
  paperswithcode: "Papers With Code",
  openai:         "OpenAI Blog",
  deepmind:       "DeepMind Blog",
  huggingface:    "HuggingFace",
  microsoft:      "Microsoft AI",
  venturebeat:    "VentureBeat",
  techcrunch:     "TechCrunch",
  theverge:       "The Verge",
  mit_review:     "MIT Tech Review",
  arstechnica:    "Ars Technica",
  simon_willison: "Simon Willison",
  tldr_ai:        "TLDR AI",
  import_ai:      "Import AI",
  ai_news:        "AI News",
  ai_edge:        "The AI Edge",
  bens_bites:     "Ben's Bites",
  deeplearning_ai:"DeepLearning.AI",
  rundown_ai:     "The Rundown AI",
};

const SOURCE_GROUPS: { label: string; color: string; sources: string[] }[] = [
  {
    label: "大模型公司",
    color: "text-violet-600",
    sources: ["openai", "deepmind", "huggingface", "microsoft"],
  },
  {
    label: "AI 媒体",
    color: "text-cyan-600",
    sources: ["venturebeat", "techcrunch", "theverge", "mit_review", "arstechnica", "ai_news"],
  },
  {
    label: "Newsletter 博主",
    color: "text-pink-600",
    sources: ["import_ai", "tldr_ai", "simon_willison", "ai_edge", "bens_bites", "deeplearning_ai", "rundown_ai"],
  },
  {
    label: "社区 & 论坛",
    color: "text-orange-600",
    sources: ["hackernews", "reddit"],
  },
  {
    label: "学术论文",
    color: "text-emerald-600",
    sources: ["arxiv", "paperswithcode"],
  },
];

const CATEGORIES = ["全部", "LLM", "视觉", "工具", "研究", "应用"];

type ViewMode = "source" | "category";

export default function BrowsePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("source");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch("/api/articles?limit=200&offset=0")
      .then((r) => r.json())
      .then((json) => {
        setArticles(json.articles || []);
        setLoading(false);
      });
  }, []);

  const filteredArticles = selectedCategory
    ? articles.filter((a) => a.category === selectedCategory)
    : articles;

  // 按来源分组
  const bySource: Record<string, Article[]> = {};
  for (const a of filteredArticles) {
    if (!bySource[a.source]) bySource[a.source] = [];
    bySource[a.source].push(a);
  }

  // 按分类分组
  const byCategory: Record<string, Article[]> = {};
  for (const a of filteredArticles) {
    const cat = a.category || "其他";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  }

  const toggleExpand = (source: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      next.has(source) ? next.delete(source) : next.add(source);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* 标题 + 视图切换 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-1">浏览 AI 资讯</h1>
            <p className="text-sm text-gray-400">来自 15+ 来源的最新 AI 动态</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("source")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === "source" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              按来源
            </button>
            <button
              onClick={() => setViewMode("category")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === "category" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              按分类
            </button>
          </div>
        </div>

        {/* 分类筛选（仅按来源视图时显示） */}
        {viewMode === "source" && (
          <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-gray-100">
            {CATEGORIES.map((cat) => {
              const val = cat === "全部" ? "" : cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === val
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-5 bg-gray-100 rounded w-32 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                      <div className="h-32 bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                        <div className="h-4 bg-gray-100 rounded" />
                        <div className="h-4 bg-gray-100 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "source" ? (
          /* ── 按来源分组视图 ── */
          <div className="space-y-14">
            {SOURCE_GROUPS.map((group) => {
              const groupArticles = group.sources.flatMap((s) => bySource[s] || []);
              if (groupArticles.length === 0) return null;

              return (
                <div key={group.label}>
                  {/* 大分组标题 */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-bold uppercase tracking-widest ${group.color}`}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">{groupArticles.length} 篇</span>
                  </div>

                  {/* 各来源子区块 */}
                  <div className="space-y-8">
                    {group.sources.map((src) => {
                      const srcArticles = bySource[src] || [];
                      if (srcArticles.length === 0) return null;
                      const isExpanded = expandedSources.has(src);
                      const shown = isExpanded ? srcArticles : srcArticles.slice(0, 3);

                      return (
                        <div key={src}>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-semibold text-gray-800 text-base">
                              {SOURCE_LABELS[src] || src}
                            </h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {srcArticles.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shown.map((article) => (
                              <ArticleCard key={article.id} article={article} />
                            ))}
                          </div>
                          {srcArticles.length > 3 && (
                            <button
                              onClick={() => toggleExpand(src)}
                              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {isExpanded ? "收起" : `查看全部 ${srcArticles.length} 篇 →`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 按分类视图 ── */
          <div className="space-y-12">
            {["LLM", "视觉", "工具", "研究", "应用", "其他"].map((cat) => {
              const catArticles = byCategory[cat] || [];
              if (catArticles.length === 0) return null;
              const isExpanded = expandedSources.has("cat_" + cat);
              const shown = isExpanded ? catArticles : catArticles.slice(0, 3);

              const catColors: Record<string, string> = {
                LLM:  "text-violet-600",
                视觉:  "text-cyan-600",
                工具:  "text-emerald-600",
                研究:  "text-amber-600",
                应用:  "text-rose-600",
                其他:  "text-gray-500",
              };

              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-xs font-bold uppercase tracking-widest ${catColors[cat] || "text-gray-500"}`}>
                      {cat}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">{catArticles.length} 篇</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shown.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                  {catArticles.length > 3 && (
                    <button
                      onClick={() => toggleExpand("cat_" + cat)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isExpanded ? "收起" : `查看全部 ${catArticles.length} 篇 →`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
