/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  // 关闭 React 严格模式以减少开发模式下的双重渲染
  reactStrictMode: false,
};

export default nextConfig;
