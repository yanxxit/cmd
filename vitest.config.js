import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'test/**/*.vitest.test.js',
      'test/git/**/*.vitest.test.js'
    ],
    exclude: [
      'node_modules',
      'test/git/run-all-tests.js'
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/git/**/*.js',
        'src/dict/**/*.js',
        'bin/git.js',
        'bin/kill-port.js',
        'bin/who-port.js',
        'bin/scan-ports.js',
        'bin/system-top.js'
      ],
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: 'test/test-results.html'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@git': path.resolve(__dirname, 'src/git'),
      '@bin': path.resolve(__dirname, 'bin'),
      '@dict': path.resolve(__dirname, 'src/dict')
    }
  }
});
