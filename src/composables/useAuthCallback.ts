/** 處理登入回呼，清除網址上的交易參數並將成功的登入帶回原頁。 */
import { onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useCurrentUser } from './useCurrentUser';

/** 回呼頁面的處理狀態與重新登入入口。 */
export function useAuthCallback() {
  const router = useRouter();
  const { finishLogin, login } = useCurrentUser();
  const failed = shallowRef(false);
  onMounted(async () => {
    const query = new URLSearchParams(window.location.search);
    window.history.replaceState(window.history.state, '', '/auth/callback');
    try {
      await router.replace(await finishLogin(query));
    } catch {
      failed.value = true;
    }
  });
  return { failed, login };
}
