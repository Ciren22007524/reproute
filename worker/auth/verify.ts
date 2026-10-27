/**
 * 驗證 JWT 並取出使用者身分。
 *
 * 一定要檢查：簽章（用簽發者的公開金鑰）、iss、aud、exp。
 * 只相信驗證過的 JWT，不直接相信 Cf-Access-Authenticated-User-Email 這類標頭。
 */
import { errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { CurrentUser } from '../../shared/auth';
import type { AuthConfig } from './config';

/** 驗證失敗；message 只用在 log，不要原樣回給前端 */
export class AuthError extends Error {
  override name = 'AuthError';
}

/** Cloudflare Access 用 RS256；自己的登入服務規劃用 ES256 或 EdDSA */
const ALLOWED_ALGORITHMS = ['RS256', 'ES256', 'EdDSA'];

/** 允許伺服器之間的時鐘誤差（秒） */
const CLOCK_TOLERANCE_SECONDS = 30;

/** 從 request 標頭取出 token；Authorization 標頭要去掉 "Bearer " */
export function extractToken(headers: Headers, tokenHeader: string): string | undefined {
  const value = headers.get(tokenHeader)?.trim();
  if (!value) return undefined;
  if (tokenHeader.toLowerCase() === 'authorization') {
    const match = /^Bearer\s+(.+)$/i.exec(value);
    return match?.[1];
  }
  return value;
}

/**
 * 驗證 token，成功時回傳使用者。
 * @param getKey 依 JWT 標頭的 kid 找公開金鑰；正式環境用遠端 JWKS，測試時用本機金鑰
 */
export async function verifyAccessToken(
  token: string,
  config: AuthConfig,
  getKey: JWTVerifyGetKey,
): Promise<CurrentUser> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getKey, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ALLOWED_ALGORITHMS,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
      requiredClaims: ['sub', 'exp'],
    }));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      throw new AuthError(`${error.code}: ${error.message}`);
    }
    throw error;
  }

  const email = typeof payload.email === 'string' ? payload.email : '';
  // sub 一定存在（requiredClaims），但型別上還是 string | undefined
  if (!payload.sub) throw new AuthError('missing sub');
  return { id: payload.sub, email };
}
