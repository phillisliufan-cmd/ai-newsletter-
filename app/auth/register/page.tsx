"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const CATEGORIES = ["LLM", "视觉", "工具", "研究", "应用"];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>(["LLM", "工具", "研究"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function toggleCategory(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 更新偏好（handle_new_user 触发器已创建基础 profile）
    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("user_profiles") as any)
        .update({ preferred_categories: selectedCats })
        .eq("id", data.user.id);
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="font-heading text-2xl font-bold text-white mb-3">确认你的邮箱</h1>
          <p className="text-gray-400 mb-6">
            我们已发送确认链接至 <span className="text-white">{email}</span>，
            点击链接完成注册后即可开始接收每日 AI 精选。
          </p>
          <Link href="/" className="btn-ghost inline-block">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-heading font-bold text-2xl text-gradient">
            AI Newsletter
          </Link>
          <h1 className="text-xl font-semibold text-white mt-4 mb-1">创建账户</h1>
          <p className="text-sm text-gray-400">订阅每日 AI 精选，免费</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="至少8位"
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">感兴趣的分类（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCats.includes(cat)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-400 bg-rose-950/30 border border-rose-800/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "注册中…" : "注册并订阅"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          已有账户？{" "}
          <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">
            登录
          </Link>
        </p>
      </div>
    </main>
  );
}
