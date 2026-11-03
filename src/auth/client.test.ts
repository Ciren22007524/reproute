/** 瀏覽器登入流程安全測試，以記憶體儲存與假 fetch 驗證，不連正式服務。 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AuthClient from './client';

let client: typeof AuthClient;
let storage: Map<string, string>;
const fetchMock = vi.fn<typeof fetch>();
const assign = vi.fn();
const KEY = 'reproute.auth.transaction';
const tokenResponse = () =>
  Response.json({ access_token: 'test-token', token_type: 'Bearer', expires_in: 900 });

beforeEach(async () => {
  vi.resetModules();
  fetchMock.mockReset();
  assign.mockReset();
  storage = new Map();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal('window', { location: { origin: 'https://reproute.cirenjhong.com', assign } });
  vi.stubGlobal('fetch', fetchMock);
  client = await import('./client');
});

function transaction(overrides: Record<string, unknown> = {}) {
  storage.set(
    KEY,
    JSON.stringify({
      state: 'expected-state',
      createdAt: Date.now(),
      returnPath: '/gyms',
      ...overrides,
    }),
  );
}

describe('登入與 callback', () => {
  it('登入只保存 state、時間與站內返回路徑', () => {
    client.beginLogin('/gyms');
    const url = new URL(assign.mock.calls[0]?.[0] as string);
    expect(url.origin).toBe('https://auth.cirenjhong.com');
    expect(url.pathname).toBe('/authorize');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://reproute.cirenjhong.com/auth/callback',
    );
    expect(JSON.parse(storage.get(KEY)!)).toEqual({
      state: url.searchParams.get('state'),
      createdAt: expect.any(Number),
      returnPath: '/gyms',
    });
    expect(url.searchParams.get('state')?.length).toBeGreaterThan(30);
  });

  it.each(['', 'state=wrong', 'state=expected-state&state=wrong'])(
    '拒絕缺少、竄改或重複的 state：%s',
    async (query) => {
      transaction();
      await expect(client.completeLogin(new URLSearchParams(query))).rejects.toMatchObject({
        kind: 'callback',
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(storage.has(KEY)).toBe(false);
    },
  );

  it.each([-1, 600_001])('拒絕未來或逾時交易：%s', async (age) => {
    transaction({ createdAt: Date.now() - age });
    await expect(
      client.completeLogin(new URLSearchParams('state=expected-state')),
    ).rejects.toMatchObject({ kind: 'callback' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('成功後交易不能重送，且 token 不會被持久化', async () => {
    transaction();
    fetchMock.mockResolvedValue(tokenResponse());
    expect(await client.completeLogin(new URLSearchParams('state=expected-state'))).toBe('/gyms');
    await expect(
      client.completeLogin(new URLSearchParams('state=expected-state')),
    ).rejects.toMatchObject({ kind: 'callback' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(storage.size).toBe(0);
  });

  it('錯誤 callback 仍驗證 state，且不換 token', async () => {
    transaction();
    await expect(
      client.completeLogin(new URLSearchParams('state=expected-state&error=access_denied')),
    ).rejects.toMatchObject({ kind: 'callback' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    '//evil.example',
    '/\\evil.example',
    '/auth/callback?state=old',
    'https://evil.example',
  ])('阻止外部返回網址或回呼循環：%s', async (returnPath) => {
    transaction({ returnPath });
    fetchMock.mockResolvedValue(tokenResponse());
    expect(await client.completeLogin(new URLSearchParams('state=expected-state'))).toBe('/');
  });
});

describe('token 與 API', () => {
  it('依服務回傳效期更新，不在有效期間重複換發', async () => {
    const now = vi.spyOn(Date, 'now');
    try {
      now.mockReturnValue(1_000_000);
      fetchMock.mockImplementation(() => Promise.resolve(tokenResponse()));
      await client.getAccessToken();
      now.mockReturnValue(1_100_000);
      await client.getAccessToken();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      now.mockReturnValue(1_880_000);
      await client.getAccessToken();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      now.mockRestore();
    }
  });

  it('並行換發合併並帶 cookie，API 帶 Bearer 且禁止快取', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(Response.json({ id: 'usr_1' }));
    await Promise.all([client.getAccessToken(), client.getAccessToken()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://auth.cirenjhong.com/token',
      expect.objectContaining({
        credentials: 'include',
        cache: 'no-store',
        body: '{"client_id":"reproute"}',
      }),
    );
    await client.apiFetch('/api/me');
    const options = fetchMock.mock.calls[1]?.[1];
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-token');
    expect(options?.cache).toBe('no-store');
  });

  it('401 login_required 清除 token 並停止換發', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'login_required' }, { status: 401 }));
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'expired' });
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'expired' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 403, 429, 500])('服務錯誤 %s 不當成登入過期、不跳轉', async (status) => {
    fetchMock.mockResolvedValue(Response.json({ error: 'failure' }, { status }));
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'unavailable' });
    expect(assign).not.toHaveBeenCalled();
  });

  it('攔截頁與網路失敗不觸發登入', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('<html>Access</html>', { headers: { 'Content-Type': 'text/html' } }),
      )
      .mockRejectedValueOnce(new TypeError('Network failure'));
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'offline' });
    expect(assign).not.toHaveBeenCalled();
  });

  it('API 持續 401 最多換發重試一次', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(client.apiFetch('/api/me')).rejects.toMatchObject({ kind: 'expired' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('寫入與 403 不自動重試', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect((await client.apiFetch('/api/save', { method: 'POST' })).status).toBe(401);
    expect((await client.apiFetch('/api/me')).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('登出失敗仍停用本機 token，可重試遠端登出', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await client.getAccessToken();
    await expect(client.logout()).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'expired' });
    await client.logout();
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://auth.cirenjhong.com/logout');
  });

  it('登出後未完成的換發不能恢復 token', async () => {
    let resolve!: (response: Response) => void;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise<Response>((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const request = client.getAccessToken();
    await client.logout();
    resolve(tokenResponse());
    await expect(request).rejects.toMatchObject({ kind: 'expired' });
    await expect(client.getAccessToken()).rejects.toMatchObject({ kind: 'expired' });
  });
});
