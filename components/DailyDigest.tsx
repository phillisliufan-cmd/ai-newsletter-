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
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 sm:p-8">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">今日 AI 要点</span>
          <span className="text-sm text-gray-400 ml-auto">{dateStr}</span>
        </div>

        {/* 要点列表 */}
        {digest.key_points && digest.key_points.length > 0 && (
          <ul className="space-y-3 mb-6">
            {digest.key_points.map((point, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-0.5 min-w-[22px] h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* 分割线 */}
        <div className="border-t border-blue-100 my-5" />

        {/* 综合分析 */}
        <div>
          <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2 block">
            综合分析
          </span>
          <p className="text-gray-600 text-sm leading-relaxed">{digest.summary_zh}</p>
        </div>

        <p className="text-xs text-gray-400 mt-4">由 Claude AI 基于今日资讯自动生成</p>
      </div>
    </section>
  );
}
