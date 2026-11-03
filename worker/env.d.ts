// Worker 的綁定與環境變數（D1、KV、Secrets、vars 等）。
// 在 wrangler.jsonc 新增後，同步補在這裡。
interface Env {
  ASSETS: Fetcher;

  // 登入驗證（見 worker/auth/config.ts）
  /** token 簽發者，例如 https://auth.cirenjhong.com */
  AUTH_ISSUER: string;
  /** 公開金鑰網址，例如 https://auth.cirenjhong.com/jwks */
  AUTH_JWKS_URL: string;
  /** 這個服務的 client_id：reproute */
  AUTH_AUDIENCE: string;
  /** token 所在的標頭；auth-service 使用 Authorization: Bearer */
  AUTH_TOKEN_HEADER: string;
}
