import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Newsletter — 每日AI精选",
  description: "精选 Hacker News、Papers With Code、GitHub Trending 的最新 AI 资讯，每日推送中文摘要",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-[#0a0a0a]">
        {children}
      </body>
    </html>
  );
}
