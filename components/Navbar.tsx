"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await getSupabase().auth.signOut();
  }

  const email = user?.email ?? "";
  const displayName = email.split("@")[0];

  return (
    <nav className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="font-heading font-bold text-lg text-gradient">
          AI Newsletter
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            浏览项目
          </Link>

          {loading ? (
            <div className="w-16 h-7 bg-gray-800 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                👤 <span className="text-gray-200">{displayName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                登录
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
