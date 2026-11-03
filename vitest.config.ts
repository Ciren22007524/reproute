import { defineConfig } from 'vitest/config';

// Worker API 與前端純函式共用 Node 測試環境。
export default defineConfig({
  test: {
    include: ['worker/**/*.test.ts', 'src/utils/**/*.test.ts'],
    environment: 'node',
  },
});
