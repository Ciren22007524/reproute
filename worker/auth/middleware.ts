/**
 * Hono middleware：要求請求帶有有效的 token，並把使用者放進 c.var.user。
 *
 * 失敗時：
 * - 設定不完整 → 500 auth_not_configured（拒絕所有請求，不會因為設定漏掉就變成公開）
 * - 沒有 token 或 token 無效 → 401 unauthorized
 */
import { createMiddleware } from 'hono/factory';
import type { JWTVerifyGetKey } from 'jose';
import type { AuthErrorBody, CurrentUser } from '../../shared/auth';
import { readAuthConfig, type AuthConfig } from './config';
import { getRemoteJwks } from './jwks';
import { AuthError, extractToken, verifyAccessToken } from './verify';

export interface AuthVariables {
  /** 已驗證的使用者 */
  user: CurrentUser;
}

export interface AuthMiddlewareOptions {
  /** 測試時換成本機金鑰；預設從設定的 JWKS 網址抓 */
  getKey?: (config: AuthConfig) => JWTVerifyGetKey;
}

export function requireAuth(options: AuthMiddlewareOptions = {}) {
  const getKey = options.getKey ?? ((config) => getRemoteJwks(config.jwksUrl));

  return createMiddleware<{ Bindings: Env; Variables: AuthVariables }>(async (c, next) => {
    const result = readAuthConfig(c.env);
    if (!result.ok) {
      console.error('Auth is not configured, missing:', result.missing.join(', '));
      return c.json<AuthErrorBody>(
        { error: 'auth_not_configured', message: '伺服器尚未設定登入驗證' },
        500,
      );
    }

    const token = extractToken(c.req.raw.headers, result.config.tokenHeader);
    if (!token) {
      return c.json<AuthErrorBody>({ error: 'unauthorized', message: '請先登入' }, 401);
    }

    try {
      c.set('user', await verifyAccessToken(token, result.config, getKey(result.config)));
    } catch (error) {
      if (error instanceof AuthError) {
        // 詳細原因只記在 log，不回給前端
        console.warn('Rejected token:', error.message);
        return c.json<AuthErrorBody>(
          { error: 'unauthorized', message: '登入已失效，請重新登入' },
          401,
        );
      }
      throw error;
    }

    await next();
  });
}
