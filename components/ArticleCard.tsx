"use client";

import { Article } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const SOURCE_LABELS: Record<string, string> = {
  hackernews: "HN",
  paperswithcode: "PWC",
  github: "GitHub",
  reddit: "Reddit",
  arxiv: "arXiv",
};

const SOURCE_COLORS: Record<string, string> = {
  hackernews: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  paperswithcode: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  github: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  reddit: "bg-red-500/20 text-red-400 border-red-500/30",
  arxiv: "bg-green-500/20 text-green-400 border-green-500/30",
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
