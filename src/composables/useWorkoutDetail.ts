/** 歷史詳細頁依 id 載入唯讀快照，忽略過期的非同步回應。 */
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { getWorkout } from '@/db/workouts';
import type { Workout } from '@/types/workout';

/** 查詢已完成紀錄。 */
export function useWorkoutDetail(id: () => string) {
  const workout = shallowRef<Workout | null>(null);
  const loading = ref(true);
  const error = ref('');
  let generation = 0;
  async function reload() {
    const current = ++generation;
    loading.value = true;
    workout.value = null;
    error.value = '';
    try {
      const value = await getWorkout(id());
      if (current === generation) workout.value = value?.status === 'completed' ? value : null;
    } catch {
      if (current === generation) error.value = '無法讀取紀錄，請稍後重試。';
    } finally {
      if (current === generation) loading.value = false;
    }
  }
  watch(
    id,
    () => {
      void reload();
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    generation++;
  });
  return { workout, loading, error, reload };
}
