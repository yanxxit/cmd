import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import AntdProvider from "@/components/AntdProvider";

import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JSON Diff Tool",
  description: "JSON 对比工具",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AntdProvider>
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
