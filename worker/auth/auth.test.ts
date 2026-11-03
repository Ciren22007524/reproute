/**
 * 登入驗證的測試：用本機產生的金鑰模擬簽發者，不需要連到 Cloudflare。
 */
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { readAuthConfig } from './config';
import { extractToken } from './verify';

const ISSUER = 'https://auth.cirenjhong.com';
const AUDIENCE = 'reproute';

const env = {
  AUTH_ISSUER: ISSUER,
  AUTH_JWKS_URL: `${ISSUER}/jwks`,
  AUTH_AUDIENCE: AUDIENCE,
  AUTH_TOKEN_HEADER: 'Authorization',
} as unknown as Env;

let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  const pair = await generateKeyPair('ES256');
  privateKey = pair.privateKey;
  otherPrivateKey = (await generateKeyPair('ES256')).privateKey;

  const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: 'key-1', alg: 'ES256' };
  const jwks = createLocalJWKSet({ keys: [jwk] });
  app = createApp({ getKey: () => jwks });
});

/** 簽一個 token；overrides 可以改掉任何欄位來模擬壞掉的 token */
function sign(
  overrides: { iss?: string; aud?: string | string[]; sub?: string; exp?: number | string } = {},
  key: CryptoKey = privateKey,
) {
  const jwt = new SignJWT({ email: 'me@gmail.com' })
    .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? [AUDIENCE])
    .setIssuedAt()
    .setExpirationTime(overrides.exp ?? '15m');
  if (overrides.sub !== '') jwt.setSubject(overrides.sub ?? 'user-abc');
  return jwt.sign(key);
}

function getMe(token?: string, requestEnv: Env = env) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  return app.request('/api/me', headers ? { headers } : {}, requestEnv);
}

describe('GET /api/me', () => {
  it('回傳已驗證的使用者', async () => {
    const res = await getMe(await sign());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ id: 'user-abc', email: 'me@gmail.com' });
  });

  it('沒有 token 時回 401', async () => {
    const res = await getMe();
    expect(res.status).toBe(401);
  });

  it('簽章不對（別人的金鑰簽的）時回 401', async () => {
    const res = await getMe(await sign({}, otherPrivateKey));
    expect(res.status).toBe(401);
  });

  it('iss 不對時回 401', async () => {
    const res = await getMe(await sign({ iss: 'https://evil.example.com' }));
    expect(res.status).toBe(401);
  });

  it('aud 不是這個服務時回 401', async () => {
    const res = await getMe(await sign({ aud: ['another-app'] }));
    expect(res.status).toBe(401);
  });

  it('過期時回 401', async () => {
    const res = await getMe(await sign({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    expect(res.status).toBe(401);
  });

  it('沒有 sub 時回 401', async () => {
    const res = await getMe(await sign({ sub: '' }));
    expect(res.status).toBe(401);
  });

  it('亂七八糟的 token 回 401', async () => {
    const res = await getMe('not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('設定不完整時拒絕所有請求（500），不會變成公開', async () => {
    const res = await getMe(await sign(), { ...env, AUTH_AUDIENCE: '' });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'auth_not_configured' });
  });

  it('只看 email 標頭不驗證 token 時，不能冒充', async () => {
    const res = await app.request(
      '/api/me',
      { headers: { 'Cf-Access-Authenticated-User-Email': 'me@gmail.com' } },
      env,
    );
    expect(res.status).toBe(401);
  });
});

describe('auth-service 必要欄位與標頭', () => {
  it.each(['email', 'iat', 'exp', 'sub'])('缺少 %s 時拒絕', async (claim) => {
    const payload: Record<string, unknown> = {
      iss: ISSUER,
      aud: AUDIENCE,
      sub: 'usr_1',
      email: 'me@gmail.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    delete payload[claim];
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .sign(privateKey);
    expect((await getMe(token)).status).toBe(401);
  });
  it.each([null, 123, '', '  '])('email 型別或內容無效時拒絕：%s', async (email) => {
    const token = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setSubject('usr_1')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(privateKey);
    expect((await getMe(token)).status).toBe(401);
  });
  it('不從舊 Access 標頭接受登入身分', async () => {
    const response = await app.request(
      '/api/me',
      { headers: { 'Cf-Access-Jwt-Assertion': await sign() } },
      env,
    );
    expect(response.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  it('不用登入', async () => {
    const res = await app.request('/api/health', {}, env);
    expect(res.status).toBe(200);
  });
});

describe('readAuthConfig', () => {
  it('列出缺少的設定', () => {
    expect(readAuthConfig({ AUTH_ISSUER: ISSUER })).toEqual({
      ok: false,
      missing: ['AUTH_JWKS_URL', 'AUTH_AUDIENCE'],
    });
  });

  it('issuer 結尾的 / 會被去掉；沒指定標頭時預設用 Cloudflare Access 的', () => {
    const result = readAuthConfig({
      AUTH_ISSUER: `${ISSUER}/`,
      AUTH_JWKS_URL: 'https://x/certs',
      AUTH_AUDIENCE: AUDIENCE,
    });
    expect(result).toMatchObject({
      ok: true,
      config: { issuer: ISSUER, tokenHeader: 'Cf-Access-Jwt-Assertion' },
    });
  });
});

describe('extractToken', () => {
  it('Authorization 標頭要有 Bearer 前綴', () => {
    expect(extractToken(new Headers({ Authorization: 'Bearer abc' }), 'Authorization')).toBe('abc');
    expect(extractToken(new Headers({ Authorization: 'abc' }), 'Authorization')).toBeUndefined();
  });
});
