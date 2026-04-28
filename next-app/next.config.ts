import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 开发环境不使用静态导出，以支持 API Routes
  // output: 'export',
  // distDir: 'dist',
  // 生产环境如果需要静态导出，取消上面的注释
  // 但需要注意：静态导出会禁用 API Routes，需要改用其他方式（如边缘函数、独立服务器等）
  
  // 支持 Swagger UI 的图片加载
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
