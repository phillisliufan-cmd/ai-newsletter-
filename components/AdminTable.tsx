"use client";

import { useState } from "react";
import { Article } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

type Props = {
  articles: Article[];
  adminEmail?: string;
  onTogglePublish: (id: string, current: boolean) => Promise<void>;
};

const SOURCE_LABELS: Record<string, string> = {
  hackernews: "HN",
  paperswithcode: "PWC",
  github: "GH",
};

export default function AdminTable({ articles, onTogglePublish }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(article: Article) {
    setLoadingId(article.id);
    await onTogglePublish(article.id, article.is_published);
    setLoadingId(null);
  }

  if (articles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">暂无文章</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-left">
            <th className="px-4 py-3 font-medium">标题</th>
            <th className="px-4 py-3 font-medium w-20">来源</th>
            <th className="px-4 py-3 font-medium w-20">分类</th>
            <th className="px-4 py-3 font-medium w-20 text-right">热度</th>
            <th className="px-4 py-3 font-medium w-28">时间</th>
            <th className="px-4 py-3 font-medium w-20 text-center">状态</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article, i) => (
            <tr
              key={article.id}
              className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                i % 2 === 0 ? "" : "bg-gray-900/20"
              }`}
            >
              <td className="px-4 py-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-purple-400 transition-colors line-clamp-1 max-w-xs block"
                >
                  {article.title}
                </a>
                {article.summary_zh && (
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{article.summary_zh}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  {SOURCE_LABELS[article.source] || article.source}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-purple-400">{article.category || "—"}</span>
              </td>
              <td className="px-4 py-3 text-right text-gray-400">
                {article.score > 0 ? article.score.toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {article.created_at
                  ? formatDistanceToNow(new Date(article.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleToggle(article)}
                  disabled={loadingId === article.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                    article.is_published ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      article.is_published ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
