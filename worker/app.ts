/**
 * Hono API 的路由（/api/*）。
 *
 * 和 index.ts 分開，是為了讓測試可以換掉驗證用的金鑰來源。
 * 前端靜態檔由 wrangler.jsonc 的 assets 處理，不會進到這裡。
 */
import { Hono } from 'hono';
import { requireAuth, type AuthMiddlewareOptions } from './auth/middleware';

export function createApp(authOptions: AuthMiddlewareOptions = {}) {
  const auth = requireAuth(authOptions);

  return (
    new Hono<{ Bindings: Env }>()
      .basePath('/api')
      // 公開：健康檢查，不需要登入
      .get('/health', (c) => c.json({ ok: true, service: 'reproute' }))
      // 需要登入：目前的使用者
      .get('/me', auth, (c) => c.json(c.var.user))
  );
}

/** 前端可用 hono/client 的 hc<AppType>() 取得有型別的 API client */
export type AppType = ReturnType<typeof createApp>;
