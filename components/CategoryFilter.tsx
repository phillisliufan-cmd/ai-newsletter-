"use client";

const CATEGORIES = ["全部", "LLM", "视觉", "工具", "研究", "应用"];
const SOURCES = [
  { value: "", label: "全部来源" },
  { value: "hackernews", label: "Hacker News" },
  { value: "paperswithcode", label: "Papers With Code" },
  { value: "github", label: "GitHub" },
];

type Props = {
  selectedCategory: string;
  selectedSource: string;
  onCategoryChange: (cat: string) => void;
  onSourceChange: (src: string) => void;
};

export default function CategoryFilter({
  selectedCategory,
  selectedSource,
  onCategoryChange,
  onSourceChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const value = cat === "全部" ? "" : cat;
          const active = selectedCategory === value;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 来源下拉 */}
      <select
        value={selectedSource}
        onChange={(e) => onSourceChange(e.target.value)}
        className="ml-auto bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
      >
        {SOURCES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
