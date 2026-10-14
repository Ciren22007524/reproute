import { Hono } from 'hono';

// 前端靜態檔由 wrangler.jsonc 的 assets 處理，這裡只接 /api/*
const app = new Hono<{ Bindings: Env }>().basePath('/api');

const routes = app.get('/health', (c) => c.json({ ok: true, service: 'reproute' }));

// 前端可用 hono/client 的 hc<AppType>() 取得有型別的 API client
export type AppType = typeof routes;

export default app;
