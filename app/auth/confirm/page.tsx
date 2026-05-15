"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "email" | "recovery" | null;

    if (!tokenHash || !type) {
      // 可能是 Supabase 旧版 magic link，直接检查 session
      getSupabase().auth.getSession().then(({ data }) => {
        if (data.session) {
          setStatus("success");
          setMessage("邮箱验证成功！正在跳转…");
          setTimeout(() => router.push("/"), 1500);
        } else {
          setStatus("error");
          setMessage("链接无效或已过期，请重新注册。");
        }
      });
      return;
    }

    getSupabase()
      .auth.verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("success");
          setMessage("邮箱验证成功！正在跳转…");
          setTimeout(() => router.push("/"), 1500);
        }
      });
  }, [searchParams, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">验证中…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">验证成功</h1>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">验证失败</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <Link href="/auth/register" className="btn-primary inline-block">
              重新注册
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
