"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    // 通过 Supabase Auth 注册（自动触发 handle_new_user，创建 user_profiles 记录）
    const { error } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(2) + "Aa1!",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      // 如果已注册，只更新订阅状态
      if (error.message.includes("already registered")) {
        setStatus("success");
        setMessage("你已是订阅者，每日精选将发送至你的邮箱 ✓");
      } else {
        setStatus("error");
        setMessage(error.message);
      }
      return;
    }

    setStatus("success");
    setMessage("订阅成功！请查收确认邮件 ✓");
    setEmail("");
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "订阅中…" : "免费订阅"}
        </button>
      </form>
      {message && (
        <p className={`text-sm mt-2 ${status === "success" ? "text-emerald-600" : "text-rose-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
