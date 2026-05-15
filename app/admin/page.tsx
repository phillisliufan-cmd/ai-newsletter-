"use client";

import { useEffect, useState } from "react";
import { supabase, Article, UserProfile } from "@/lib/supabase";
import AdminTable from "@/components/AdminTable";
import Link from "next/link";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim());

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [tab, setTab] = useState<"articles" | "users">("articles");
  const [digestLoading, setDigestLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email || null;
      setAdminEmail(email);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!adminEmail) return;
    loadArticles();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail]);

  async function loadArticles() {
    setArticlesLoading(true);
    const res = await fetch("/api/articles?limit=100&offset=0");
    const json = await res.json();
    setArticles(json.articles || []);
    setArticlesLoading(false);
  }

  async function loadUsers() {
    const { data } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  }

  async function handleTogglePublish(id: string, current: boolean) {
    const res = await fetch("/api/articles", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-email": adminEmail!,
      },
      body: JSON.stringify({ id, is_published: !current }),
    });
    if (res.ok) {
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_published: !current } : a))
      );
    }
  }

  async function handleSendDigest() {
    setDigestLoading(true);
    setActionMsg("");
    const res = await fetch("/api/digest", {
      method: "POST",
      headers: { "x-admin-email": adminEmail! },
    });
    const json = await res.json();
    if (res.ok) {
      setActionMsg(`邮件发送成功！共发送给 ${json.sentCount} 位订阅者，包含 ${json.articleCount} 篇文章。`);
    } else {
      setActionMsg(`发送失败: ${json.error}`);
    }
    setDigestLoading(false);
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中…</div>
      </main>
    );
  }

  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-white mb-2">无访问权限</h1>
          <p className="text-gray-400 mb-6">此页面仅管理员可访问</p>
          <Link href="/auth/login" className="btn-primary">登录管理员账户</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-heading font-bold text-lg text-gradient">AI Newsletter</Link>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">管理后台</span>
          </div>
          <span className="text-xs text-gray-500">{adminEmail}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 操作按钮 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={handleSendDigest}
            disabled={digestLoading}
            className="btn-primary disabled:opacity-60"
          >
            {digestLoading ? "发送中…" : "发送今日摘要"}
          </button>
          <button onClick={loadArticles} className="btn-ghost">
            刷新文章
          </button>
          {actionMsg && (
            <span className="text-sm text-emerald-400">{actionMsg}</span>
          )}
        </div>

        {/* Tab */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("articles")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "articles" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            文章管理 ({articles.length})
          </button>
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "users" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            订阅用户 ({users.length})
          </button>
        </div>

        {/* 文章列表 */}
        {tab === "articles" && (
          articlesLoading ? (
            <div className="text-center py-10 text-gray-500">加载中…</div>
          ) : (
            <AdminTable
              articles={articles}
              adminEmail={adminEmail}
              onTogglePublish={handleTogglePublish}
            />
          )
        )}

        {/* 用户列表 */}
        {tab === "users" && (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">邮箱</th>
                  <th className="px-4 py-3 font-medium">偏好分类</th>
                  <th className="px-4 py-3 font-medium w-20 text-center">订阅状态</th>
                  <th className="px-4 py-3 font-medium w-32">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-200">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.preferred_categories || []).map((cat) => (
                          <span key={cat} className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${user.subscribed ? "text-emerald-400" : "text-gray-500"}`}>
                        {user.subscribed ? "已订阅" : "已退订"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
