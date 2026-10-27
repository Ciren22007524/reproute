/**
 * 廠區清單頁的狀態：載入清單、新增、刪除。
 * 對話框（輸入名稱、確認刪除）也放在這裡，頁面只需要呼叫 addGym / confirmDelete。
 */
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { createGym, deleteGym, listGyms } from '@/db/gyms';
import type { Gym } from '@/types/domain';

export function useGymList() {
  const $q = useQuasar();
  const router = useRouter();

  /** 所有廠區，最近修改的在前 */
  const gyms = ref<Gym[]>([]);

  async function reload() {
    gyms.value = await listGyms();
  }

  onMounted(reload);

  /** 跳出輸入名稱的對話框；建立後直接進入清點頁 */
  function addGym() {
    $q.dialog({
      title: '新增廠區',
      message: '例如：健身工廠 XX 廠',
      prompt: { model: '', type: 'text', isValid: (v: string) => v.trim().length > 0 },
      cancel: true,
    }).onOk((name: string) => {
      // Quasar 的 onOk 不會等 Promise，用 void 明確表示不等待
      void createAndOpen(name);
    });
  }

  async function createAndOpen(name: string) {
    const gym = await createGym(name);
    await router.push(`/gyms/${gym.id}`);
  }

  /** 跳出確認對話框，確定後刪除並重新載入清單 */
  function confirmDelete(gym: Gym) {
    $q.dialog({
      title: '刪除廠區',
      message: `確定要刪除「${gym.name}」以及它的清點結果嗎？`,
      cancel: true,
      ok: { label: '刪除', color: 'negative', flat: true },
    }).onOk(() => {
      void removeAndReload(gym.id);
    });
  }

  async function removeAndReload(id: string) {
    await deleteGym(id);
    await reload();
  }

  return { gyms, addGym, confirmDelete };
}
