/** auth-service 的瀏覽器用戶端：token 僅存記憶體，登入交易只保存一次性的 state。 */
const AUTH_ORIGIN = 'https://auth.cirenjhong.com';
const APP_ORIGIN = 'https://reproute.cirenjhong.com';
const TRANSACTION_KEY = 'reproute.auth.transaction';
const TRANSACTION_TTL = 10 * 60 * 1000;

/** 登入失敗的種類，供畫面選擇一般性訊息。 */
export class LoginError extends Error {
  constructor(public readonly kind: 'expired' | 'offline' | 'unavailable' | 'callback') {
    super(kind);
  }
}

let accessToken: string | undefined;
let expiresAt = 0;
let pending: Promise<string> | undefined;
let generation = 0;
let stopped = false;

/** 清除本機 token，並阻止尚未完成的換發恢復登入。 */
export function clearSession() {
  generation++;
  accessToken = undefined;
  expiresAt = 0;
  pending = undefined;
  stopped = true;
}

async function authRequest(path: string, body: object) {
  try {
    return await fetch(`${AUTH_ORIGIN}${path}`, {
      method: 'POST',
      credentials: 'include',
      redirect: 'error',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: 'reproute', ...body }),
    });
  } catch {
    throw new LoginError('offline');
  }
}

async function exchangeToken(version: number) {
  const response = await authRequest('/token', {});
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new LoginError('unavailable');
  }
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (version !== generation) throw new LoginError('expired');
  if (response.status === 401 && body?.error === 'login_required') {
    clearSession();
    throw new LoginError('expired');
  }
  if (
    !response.ok ||
    typeof body?.access_token !== 'string' ||
    !body.access_token ||
    body.token_type !== 'Bearer' ||
    typeof body.expires_in !== 'number' ||
    !Number.isFinite(body.expires_in) ||
    body.expires_in <= 0
  ) {
    throw new LoginError('unavailable');
  }
  accessToken = body.access_token;
  expiresAt = Date.now() + body.expires_in * 1000;
  return accessToken;
}

/** 合併同分頁的並行換發，只在即將到期或明確要求時更新。 */
export function getAccessToken(force = false): Promise<string> {
  if (stopped) return Promise.reject(new LoginError('expired'));
  if (!force && accessToken && Date.now() < expiresAt - 30_000) {
    return Promise.resolve(accessToken);
  }
  if (pending) return pending;
  const request = exchangeToken(generation);
  pending = request;
  void request
    .finally(() => {
      if (pending === request) pending = undefined;
    })
    .catch(() => {});
  return request;
}

/** 僅送往本站 API；只有讀取請求在 401 時自動換發並重試一次。 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!path.startsWith('/api/')) throw new Error('Invalid API path');
  const send = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    return fetch(path, { ...init, headers, redirect: 'error', cache: 'no-store' });
  };
  const token = await getAccessToken();
  let response = await send(token);
  const method = (init.method ?? 'GET').toUpperCase();
  if (response.status === 401 && (method === 'GET' || method === 'HEAD')) {
    // 其他並行請求可能已換好，避免再次輪替 refresh cookie。
    const next =
      accessToken && accessToken !== token ? await getAccessToken() : await getAccessToken(true);
    response = await send(next);
    if (response.status === 401) {
      clearSession();
      throw new LoginError('expired');
    }
  }
  return response;
}

function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  const url = new URL(value, APP_ORIGIN);
  if (url.origin !== APP_ORIGIN || url.pathname === '/auth/callback') return '/';
  return `${url.pathname}${url.search}${url.hash}`;
}

/** 由使用者主動開始登入；非正式網域不啟動無法完成的同站 cookie 流程。 */
export function beginLogin(returnPath = '/') {
  if (window.location.origin !== APP_ORIGIN) throw new LoginError('unavailable');
  const state = crypto.randomUUID();
  try {
    sessionStorage.setItem(
      TRANSACTION_KEY,
      JSON.stringify({ state, createdAt: Date.now(), returnPath: safeReturnPath(returnPath) }),
    );
  } catch {
    throw new LoginError('unavailable');
  }
  const url = new URL('/authorize', AUTH_ORIGIN);
  url.search = new URLSearchParams({
    client_id: 'reproute',
    redirect_uri: `${APP_ORIGIN}/auth/callback`,
    state,
  }).toString();
  window.location.assign(url.href);
}

/** callback 不論成功或錯誤都先消耗、驗證 state，失敗時絕不換發 token。 */
export async function completeLogin(query: URLSearchParams): Promise<string> {
  let transaction: Record<string, unknown> | null;
  try {
    const raw = sessionStorage.getItem(TRANSACTION_KEY);
    sessionStorage.removeItem(TRANSACTION_KEY);
    transaction = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    throw new LoginError('callback');
  }
  if (
    !transaction ||
    typeof transaction.state !== 'string' ||
    !transaction.state ||
    query.getAll('state').length !== 1 ||
    query.get('state') !== transaction.state ||
    typeof transaction.createdAt !== 'number' ||
    !Number.isFinite(transaction.createdAt) ||
    Date.now() < transaction.createdAt ||
    Date.now() - transaction.createdAt > TRANSACTION_TTL
  )
    throw new LoginError('callback');
  if (query.has('error')) throw new LoginError('callback');
  stopped = false;
  await getAccessToken(true);
  return safeReturnPath(transaction.returnPath);
}

/** 撤銷遠端 refresh session；失敗也清除本機身分，但不宣稱遠端登出成功。 */
export async function logout() {
  clearSession();
  const response = await authRequest('/logout', { all: false });
  if (response.status !== 204) throw new LoginError('unavailable');
}
