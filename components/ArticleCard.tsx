"use client";

import { Article } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const SOURCE_LABELS: Record<string, string> = {
  hackernews: "Hacker News",
  paperswithcode: "Papers With Code",
  reddit: "Reddit",
  arxiv: "arXiv",
  openai: "OpenAI",
  deepmind: "DeepMind",
  huggingface: "HuggingFace",
  microsoft: "Microsoft AI",
  venturebeat: "VentureBeat",
  techcrunch: "TechCrunch",
  theverge: "The Verge",
  mit_review: "MIT Tech Review",
  arstechnica: "Ars Technica",
  simon_willison: "Simon Willison",
  tldr_ai: "TLDR AI",
  import_ai: "Import AI",
  ai_news: "AI News",
  ai_edge: "The AI Edge",
  bens_bites: "Ben's Bites",
  deeplearning_ai: "DeepLearning.AI",
  rundown_ai: "The Rundown AI",
};

// Color of the small source label text
const SOURCE_COLORS: Record<string, string> = {
  hackernews:     "text-orange-600",
  reddit:         "text-red-600",
  arxiv:          "text-emerald-700",
  paperswithcode: "text-blue-600",
  openai:         "text-violet-700",
  deepmind:       "text-blue-700",
  huggingface:    "text-yellow-700",
  microsoft:      "text-blue-600",
  venturebeat:    "text-cyan-700",
  techcrunch:     "text-green-700",
  theverge:       "text-red-700",
  mit_review:     "text-indigo-700",
  arstechnica:    "text-orange-700",
  simon_willison: "text-pink-700",
  tldr_ai:        "text-pink-600",
  import_ai:      "text-pink-700",
  ai_news:        "text-rose-600",
  ai_edge:        "text-purple-700",
  bens_bites:     "text-amber-700",
  deeplearning_ai:"text-teal-700",
  rundown_ai:     "text-fuchsia-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  LLM:  "bg-violet-100 text-violet-700",
  视觉:  "bg-cyan-100 text-cyan-700",
  工具:  "bg-emerald-100 text-emerald-700",
  研究:  "bg-amber-100 text-amber-700",
  应用:  "bg-rose-100 text-rose-700",
};

// Gradient covers by category (since articles have no images)
const CATEGORY_GRADIENTS: Record<string, string> = {
  LLM:  "from-violet-50 to-purple-100",
  视觉:  "from-cyan-50 to-blue-100",
  工具:  "from-emerald-50 to-green-100",
  研究:  "from-amber-50 to-yellow-100",
  应用:  "from-rose-50 to-pink-100",
};

const SOURCE_GRADIENTS: Record<string, string> = {
  hackernews:  "from-orange-50 to-amber-100",
  reddit:      "from-red-50 to-orange-100",
  arxiv:       "from-emerald-50 to-teal-100",
  openai:      "from-violet-50 to-purple-100",
  deepmind:    "from-blue-50 to-indigo-100",
  huggingface: "from-yellow-50 to-amber-100",
};

type Props = {
  article: Article;
  featured?: boolean;
  large?: boolean;
};

export default function ArticleCard({ article, featured = false, large = false }: Props) {
  const summary = article.summary_zh
    ? article.summary_zh.slice(0, large ? 200 : 120) + (article.summary_zh.length > (large ? 200 : 120) ? "…" : "")
    : "摘要生成中…";

  const timeAgo = article.published_at || article.created_at
    ? formatDistanceToNow(new Date(article.published_at || article.created_at), {
        addSuffix: true,
        locale: zhCN,
      })
    : "";

  const gradient =
    (article.category && CATEGORY_GRADIENTS[article.category]) ||
    SOURCE_GRADIENTS[article.source] ||
    "from-gray-50 to-slate-100";

  return (
    <article
      className={`
        group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden
        card-hover cursor-pointer shadow-sm
        ${featured ? "ring-2 ring-blue-100" : ""}
      `}
    >
      {/* Cover: real image or gradient fallback */}
      {article.image_url ? (
        <div className={`${large ? "h-48" : "h-32"} w-full overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // hide broken image, show gradient fallback via parent
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className={`bg-gradient-to-br ${gradient} ${large ? "h-48" : "h-32"} w-full flex items-end justify-start px-5 pb-3`}>
          <span className="text-xs font-semibold uppercase tracking-widest opacity-40 text-gray-600 select-none">
            {article.category || article.source}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-5 flex-1">
        {/* Source + Category row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold uppercase tracking-wide ${SOURCE_COLORS[article.source] || "text-gray-500"}`}>
            {SOURCE_LABELS[article.source] || article.source}
          </span>
          {article.category && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-600"}`}>
              {article.category}
            </span>
          )}
          {article.score > 0 && (
            <span className="ml-auto text-xs text-gray-400">▲ {article.score.toLocaleString()}</span>
          )}
        </div>

        {/* Title */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-heading font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors duration-150 line-clamp-2 ${large ? "text-xl" : "text-base"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {article.title}
        </a>

        {/* Summary */}
        <p className={`text-gray-500 leading-relaxed ${large ? "text-sm line-clamp-4" : "text-xs line-clamp-3"}`}>{summary}</p>

        {/* Tags + time */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-2">
          <div className="flex flex-wrap gap-1">
            {(article.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          {timeAgo && (
            <span className="text-xs text-gray-400 shrink-0">{timeAgo}</span>
          )}
        </div>
      </div>
    </article>
  );
}
