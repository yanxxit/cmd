/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  // React 19 严格模式
  reactStrictMode: true,
  // 图片优化配置
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
