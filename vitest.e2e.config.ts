import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/test/e2e/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 30000, // 30 seconds for E2E tests
    hookTimeout: 30000
  }
});