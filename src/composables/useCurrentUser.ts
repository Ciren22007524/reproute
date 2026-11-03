/** 共用登入狀態與帳號操作；快取僅供離線顯示，不作為 API 身分。 */
import { readonly, shallowRef } from 'vue';
import type { CurrentUser } from '../../shared/auth';
import {
  apiFetch,
  beginLogin,
  clearSession,
  completeLogin,
  LoginError,
  logout,
} from '../auth/client';

/** 帳號選單顯示的登入狀態。 */
export type CurrentUserStatus =
  'loading' | 'signed-in' | 'offline' | 'expired' | 'unavailable' | 'signed-out' | 'logout-failed';
const CACHE_KEY = 'reproute.currentUser';
const user = shallowRef<CurrentUser | null>(readCache());
const status = shallowRef<CurrentUserStatus>('loading');
let loading: Promise<void> | undefined;
let revision = 0;

function readCache(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const value = raw ? (JSON.parse(raw) as Partial<CurrentUser> | null) : null;
    return value && typeof value.id === 'string' && typeof value.email === 'string'
      ? { id: value.id, email: value.email }
      : null;
  } catch {
    return null;
  }
}

function setUser(value: CurrentUser | null) {
  user.value = value;
  try {
    if (value) localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* 私密瀏覽可能禁止儲存，仍可使用記憶體狀態。 */
  }
}

function handleError(error: unknown) {
  if (error instanceof LoginError && error.kind === 'expired') {
    setUser(null);
    status.value = 'expired';
  } else
    status.value =
      (error instanceof LoginError && error.kind === 'offline') || error instanceof TypeError
        ? 'offline'
        : 'unavailable';
}

async function fetchCurrentUser() {
  const version = revision;
  status.value = 'loading';
  try {
    const response = await apiFetch('/api/me');
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
      throw new LoginError('unavailable');
    const value = (await response.json()) as Partial<CurrentUser> | null;
    if (!value || typeof value.id !== 'string' || typeof value.email !== 'string')
      throw new LoginError('unavailable');
    if (version !== revision) return;
    setUser({ id: value.id, email: value.email });
    status.value = 'signed-in';
  } catch (error) {
    if (version === revision) handleError(error);
  }
}

/** 帳號操作與 callback 共用同一份狀態，callback 完成前不自動恢復登入。 */
export function useCurrentUser() {
  if (window.location.pathname !== '/auth/callback') loading ??= fetchCurrentUser();
  function refresh() {
    if (window.location.pathname === '/auth/callback') return Promise.resolve();
    if (status.value === 'signed-out' || status.value === 'logout-failed') return Promise.resolve();
    return (loading = fetchCurrentUser());
  }
  function login() {
    try {
      beginLogin(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    } catch (error) {
      handleError(error);
    }
  }
  async function finishLogin(query: URLSearchParams) {
    try {
      const path = await completeLogin(query);
      loading = fetchCurrentUser();
      await loading;
      if (status.value !== 'signed-in') throw new LoginError('unavailable');
      return path;
    } catch (error) {
      clearSession();
      setUser(null);
      handleError(error);
      throw error;
    }
  }
  async function signOut() {
    revision++;
    setUser(null);
    status.value = 'loading';
    try {
      await logout();
      status.value = 'signed-out';
    } catch {
      status.value = 'logout-failed';
    }
  }
  return { user: readonly(user), status: readonly(status), refresh, login, finishLogin, signOut };
}
