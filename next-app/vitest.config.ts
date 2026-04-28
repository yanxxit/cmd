import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 测试环境 - 使用 node 环境
    environment: 'node',
    
    // 不包含 UI 测试
    include: ['tests/**/*.test.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.js'],
    
    // 测试超时时间
    testTimeout: 30000,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock-*.ts',
        '**/coverage/',
        'docs/',
      ],
    },
    
    // 全局测试钩子
    setupFiles: ['./tests/setup.ts'],
    
    // 全局变量
    globals: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'types': path.resolve(__dirname, './types'),
      'lib': path.resolve(__dirname, './lib'),
      'components': path.resolve(__dirname, './components'),
      'pages': path.resolve(__dirname, './pages'),
    },
  },
});
