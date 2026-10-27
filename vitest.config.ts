import { defineConfig } from 'vitest/config';

// 目前只測 Worker（Hono API）；之後可以把前端的純函式測試也加進來
export default defineConfig({
  test: {
    include: ['worker/**/*.test.ts'],
    environment: 'node',
  },
});
