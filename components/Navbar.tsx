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
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="font-heading font-bold text-lg text-gray-900 tracking-tight">
          AI <span className="text-blue-600">Newsletter</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
            浏览资讯
          </Link>

          {loading ? (
            <div className="w-16 h-7 bg-gray-100 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                登录
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5 px-4">
                订阅
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
