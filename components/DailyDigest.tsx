"use client";

type DigestData = {
  date: string;
  summary_zh: string;
  key_points: string[];
  created_at: string;
};

type Props = {
  digest: DigestData | null;
};

export default function DailyDigest({ digest }: Props) {
  if (!digest) return null;

  const dateStr = new Date(digest.date).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-950/40 via-gray-900/60 to-cyan-950/30 p-6 sm:p-8">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <h2 className="font-heading text-xl font-bold text-white">
            今日 AI 要点
          </h2>
          <span className="text-sm text-gray-500 ml-auto">{dateStr}</span>
        </div>

        {/* 要点列表 */}
        {digest.key_points && digest.key_points.length > 0 && (
          <ul className="space-y-2 mb-6">
            {digest.key_points.map((point, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-1 w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs text-purple-400 shrink-0 font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-200 text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* 分割线 */}
        <div className="border-t border-gray-700/50 my-5" />

        {/* 综合分析 */}
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 block">
            综合分析
          </span>
          <p className="text-gray-300 text-sm leading-relaxed">{digest.summary_zh}</p>
        </div>

        {/* 底部标注 */}
        <p className="text-xs text-gray-600 mt-4">由 Claude AI 基于今日资讯自动生成</p>
      </div>
    </section>
  );
}
