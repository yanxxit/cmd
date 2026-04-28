import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  // distDir: '../public/page',
  // 支持 Swagger UI 的图片加载
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
