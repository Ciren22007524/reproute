/**
 * 讀取登入驗證的設定（來自 wrangler.jsonc 的 vars）。
 *
 * 驗證程式本身是通用的：現在指向 Cloudflare Access，
 * 之後換成自己的登入服務（docs/auth-service.md）時只要改這些設定。
 */

export interface AuthConfig {
  /** token 的簽發者，必須和 JWT 的 iss 完全一樣 */
  issuer: string;
  /** 簽發者公開金鑰（JWKS）的網址 */
  jwksUrl: string;
  /** 這個服務的識別，JWT 的 aud 必須包含它 */
  audience: string;
  /** token 放在哪個 request 標頭；Authorization 時會去掉開頭的 "Bearer " */
  tokenHeader: string;
}

/** 從環境變數組出設定；有缺漏時回傳缺少的變數名稱，讓呼叫端拒絕所有請求（fail closed） */
export function readAuthConfig(
  env: Partial<Record<keyof AuthVars, string>>,
): { ok: true; config: AuthConfig } | { ok: false; missing: string[] } {
  const required = ['AUTH_ISSUER', 'AUTH_JWKS_URL', 'AUTH_AUDIENCE'] as const;
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    config: {
      // 去掉結尾的 /，避免 https://x.com/ 和 https://x.com 比對不上
      issuer: env.AUTH_ISSUER!.trim().replace(/\/+$/, ''),
      jwksUrl: env.AUTH_JWKS_URL!.trim(),
      audience: env.AUTH_AUDIENCE!.trim(),
      tokenHeader: env.AUTH_TOKEN_HEADER?.trim() || 'Cf-Access-Jwt-Assertion',
    },
  };
}

/** 驗證相關的環境變數名稱（型別定義在 worker/env.d.ts） */
export interface AuthVars {
  AUTH_ISSUER: string;
  AUTH_JWKS_URL: string;
  AUTH_AUDIENCE: string;
  AUTH_TOKEN_HEADER: string;
}
