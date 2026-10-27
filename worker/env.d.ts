// Worker 的綁定與環境變數（D1、KV、Secrets、vars 等）。
// 在 wrangler.jsonc 新增後，同步補在這裡。
interface Env {
  ASSETS: Fetcher;

  // 登入驗證（見 worker/auth/config.ts）
  /** token 簽發者，例如 https://<team>.cloudflareaccess.com */
  AUTH_ISSUER: string;
  /** 公開金鑰網址，例如 https://<team>.cloudflareaccess.com/cdn-cgi/access/certs */
  AUTH_JWKS_URL: string;
  /** 這個服務的識別；Cloudflare Access 時填應用程式的 AUD tag */
  AUTH_AUDIENCE: string;
  /** token 所在的標頭；Cloudflare Access 是 Cf-Access-Jwt-Assertion */
  AUTH_TOKEN_HEADER: string;
}
