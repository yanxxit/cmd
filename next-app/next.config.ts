import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  // distDir: '../public/page',// 开发模式时有影响
};

export default nextConfig;
