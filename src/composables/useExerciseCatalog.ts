/** 動作資料庫頁的查詢與廠區狀態，頁面不直接讀寫 IndexedDB。 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { listGyms } from '@/db/gyms';
import { exercises } from '@/data/exercises';
import type { Gym } from '@/types/domain';
import { filterExercises } from '@/utils/exercises';

/** 提供搜尋、動作模式與廠區器材篩選。 */
export function useExerciseCatalog() {
  const keyword = ref<string | null>('');
  const pattern = ref<string | null>(null);
  const gymId = ref<string | null>(null);
  const gyms = shallowRef<Gym[]>([]);
  const loading = ref(true);
  const error = ref('');
  const inventory = computed(() => gyms.value.find((gym) => gym.id === gymId.value)?.inventory);
  const patterns = [...new Set(exercises.map((item) => item.pattern))];
  const gymOptions = computed(() => gyms.value.map((gym) => ({ label: gym.name, value: gym.id })));
  const results = computed(() =>
    filterExercises(exercises, keyword.value ?? '', pattern.value, inventory.value),
  );

  /** 失敗時可重試；不把載入失敗誤認為沒有廠區。 */
  async function reload() {
    loading.value = true;
    error.value = '';
    try {
      gyms.value = await listGyms();
    } catch {
      error.value = '無法讀取廠區，請確認瀏覽器可儲存資料後重試。';
    } finally {
      loading.value = false;
    }
  }
  onMounted(reload);
  return {
    keyword,
    pattern,
    gymId,
    gyms,
    patterns,
    gymOptions,
    results,
    inventory,
    loading,
    error,
    reload,
  };
}
