/**
 * Cloudflare Worker 的進入點。
 * 只有 /api/* 會進到這裡（見 wrangler.jsonc 的 run_worker_first），路由定義在 app.ts。
 */
import { createApp } from './app';

export type { AppType } from './app';

export default createApp();
