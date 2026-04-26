/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  output: isDev ? undefined : 'export',
  distDir: 'dist',
  // React 19 严格模式
  reactStrictMode: true,
  // 添加 basePath 以支持通过 /next 前缀访问构建产物
  basePath: '/next',
  // 图片优化配置
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (isDev) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
