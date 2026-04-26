import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import AntdProvider from "@/components/AntdProvider";

import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next App",
  description: "Next.js 应用",
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
