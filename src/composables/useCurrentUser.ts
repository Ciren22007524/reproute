/**
 * 目前登入的使用者（呼叫 /api/me）。
 *
 * 狀態放在模組層級，整個 App 共用同一份，只會在第一次使用時載入。
 * 登入本身由 Cloudflare Access 處理；這裡只是讀取「現在是誰」。
 */
import { readonly, ref } from 'vue';
import type { CurrentUser } from '../../shared/auth';

/**
 * - loading：載入中
 * - signed-in：已登入，user 有值
 * - offline：連不到伺服器，user 是上次登入的快取（可能為 null）
 * - expired：Access 的登入已過期（請求被轉去登入頁），重新整理頁面即可重新登入
 * - unavailable：伺服器回了非預期的結果（例如本機開發沒有 Worker，或尚未設定驗證）
 */
export type CurrentUserStatus = 'loading' | 'signed-in' | 'offline' | 'expired' | 'unavailable';

/** 上次登入的使用者存在 localStorage，離線時顯示用 */
const CACHE_KEY = 'reproute.currentUser';

const user = ref<CurrentUser | null>(readCache());
const status = ref<CurrentUserStatus>('loading');
let loading: Promise<void> | undefined;

function readCache(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

function writeCache(value: CurrentUser | null) {
  try {
    if (value) localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // 私密瀏覽等情況下 localStorage 可能不能用，忽略即可
  }
}

async function fetchCurrentUser() {
  status.value = 'loading';
  let res: Response;
  try {
    // redirect: 'manual'：Access 登入過期時會把請求轉去登入頁，
    // 不跟著轉，才能分辨出「過期」而不是拿到一個 HTML 頁面
    res = await fetch('/api/me', { redirect: 'manual', headers: { Accept: 'application/json' } });
  } catch {
    status.value = 'offline';
    return;
  }

  if (res.type === 'opaqueredirect') {
    status.value = 'expired';
    return;
  }
  if (res.status === 401) {
    user.value = null;
    writeCache(null);
    status.value = 'expired';
    return;
  }
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    status.value = 'unavailable';
    return;
  }

  user.value = (await res.json()) as CurrentUser;
  writeCache(user.value);
  status.value = 'signed-in';
}

export function useCurrentUser() {
  // 第一次使用時才載入；之後共用結果
  loading ??= fetchCurrentUser();

  /** 重新向伺服器確認目前的使用者 */
  function refresh() {
    loading = fetchCurrentUser();
    return loading;
  }

  return { user: readonly(user), status: readonly(status), refresh };
}
