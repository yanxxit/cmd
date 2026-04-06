import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/git/**/*.test.js'],
    exclude: ['test/git/run-all-tests.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/git/**/*.js', 'bin/git.js'],
      exclude: ['src/git/sparseClone.js']
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: 'test/git/test-results.html'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@git': path.resolve(__dirname, 'src/git'),
      '@bin': path.resolve(__dirname, 'bin')
    }
  }
});
