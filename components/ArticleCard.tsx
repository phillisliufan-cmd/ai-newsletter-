"use client";

import { Article } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const SOURCE_LABELS: Record<string, string> = {
  hackernews: "Hacker News",
  paperswithcode: "Papers With Code",
  reddit: "Reddit",
  arxiv: "arXiv",
  // 大模型公司博客
  openai: "OpenAI",
  deepmind: "DeepMind",
  huggingface: "HuggingFace",
  microsoft: "Microsoft AI",
  // 科技媒体
  venturebeat: "VentureBeat",
  techcrunch: "TechCrunch",
  theverge: "The Verge",
  mit_review: "MIT Tech Review",
  arstechnica: "Ars Technica",
  // Newsletter 博主
  simon_willison: "Simon Willison",
  tldr_ai: "TLDR AI",
  import_ai: "Import AI",
  ai_news: "AI News",
  ai_edge: "The AI Edge",
  bens_bites: "Ben's Bites",
  deeplearning_ai: "DeepLearning.AI",
  rundown_ai: "The Rundown AI",
};

const SOURCE_COLORS: Record<string, string> = {
  hackernews:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  reddit:        "bg-red-500/20 text-red-400 border-red-500/30",
  arxiv:         "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paperswithcode:"bg-blue-500/20 text-blue-400 border-blue-500/30",
  // 公司博客 — 紫色系
  openai:        "bg-purple-500/20 text-purple-300 border-purple-500/30",
  deepmind:      "bg-purple-500/20 text-purple-300 border-purple-500/30",
  huggingface:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  microsoft:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  // 科技媒体 — 青色系
  venturebeat:   "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  techcrunch:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  theverge:      "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  mit_review:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  arstechnica:   "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  // Newsletter — 粉色系
  simon_willison:"bg-pink-500/20 text-pink-400 border-pink-500/30",
  tldr_ai:       "bg-pink-500/20 text-pink-400 border-pink-500/30",
  import_ai:     "bg-pink-500/20 text-pink-400 border-pink-500/30",
  ai_news:       "bg-pink-500/20 text-pink-400 border-pink-500/30",
  ai_edge:       "bg-pink-500/20 text-pink-400 border-pink-500/30",
  bens_bites:    "bg-pink-500/20 text-pink-400 border-pink-500/30",
  deeplearning_ai:"bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const CATEGORY_COLORS: Record<string, string> = {
  LLM: "bg-purple-500/20 text-purple-400",
  视觉: "bg-cyan-500/20 text-cyan-400",
  工具: "bg-emerald-500/20 text-emerald-400",
  研究: "bg-amber-500/20 text-amber-400",
  应用: "bg-rose-500/20 text-rose-400",
};

type Props = {
  article: Article;
  featured?: boolean;
};

export default function ArticleCard({ article, featured = false }: Props) {
  const summary = article.summary_zh
    ? article.summary_zh.slice(0, 100) + (article.summary_zh.length > 100 ? "…" : "")
    : "摘要生成中…";

  const timeAgo = article.published_at || article.created_at
    ? formatDistanceToNow(new Date(article.published_at || article.created_at), {
        addSuffix: true,
        locale: zhCN,
      })
    : "";

  return (
    <article
      className={`
        group relative flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-5
        card-hover cursor-pointer
        ${featured ? "border-purple-800/50 bg-purple-950/20" : ""}
      `}
    >
      {featured && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-full px-2 py-0.5">
          精选
        </span>
      )}

      {/* 来源 + 分类 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`badge border ${SOURCE_COLORS[article.source] || "bg-gray-700 text-gray-300"}`}
        >
          {SOURCE_LABELS[article.source] || article.source}
        </span>
        {article.category && (
          <span className={`badge ${CATEGORY_COLORS[article.category] || "bg-gray-700 text-gray-400"}`}>
            {article.category}
          </span>
        )}
        {article.score > 0 && (
          <span className="text-xs text-gray-500">▲ {article.score.toLocaleString()}</span>
        )}
      </div>

      {/* 标题 */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-heading font-semibold text-gray-100 leading-snug group-hover:text-purple-300 transition-colors duration-150 line-clamp-2"
        onClick={(e) => e.stopPropagation()}
      >
        {article.title}
      </a>

      {/* 摘要 */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{summary}</p>

      {/* 标签 + 时间 */}
      <div className="flex items-end justify-between gap-2 mt-auto pt-1">
        <div className="flex flex-wrap gap-1">
          {(article.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        {timeAgo && (
          <span className="text-xs text-gray-600 shrink-0">{timeAgo}</span>
        )}
      </div>
    </article>
  );
}
