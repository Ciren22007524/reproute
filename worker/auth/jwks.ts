/**
 * 取得簽發者的公開金鑰（JWKS）。
 *
 * 結果放在模組層級的快取：同一個 Worker 執行個體處理很多請求時，不會每次都重新下載。
 * jose 的 createRemoteJWKSet 自己也會快取，遇到不認得的 kid（例如金鑰輪替）才重新抓。
 */
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

const cache = new Map<string, JWTVerifyGetKey>();

export function getRemoteJwks(jwksUrl: string): JWTVerifyGetKey {
  let jwks = cache.get(jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl), {
      // 公開金鑰很少變，快取久一點省 request；遇到新的 kid 時 jose 會自動重抓
      cacheMaxAge: 6 * 60 * 60 * 1000,
      cooldownDuration: 30 * 1000,
    });
    cache.set(jwksUrl, jwks);
  }
  return jwks;
}
