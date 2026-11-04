/** 讀取與刪除本機已完成訓練，不依賴登入或遠端 API。 */
import { onMounted, ref, shallowRef } from 'vue';
import { useQuasar } from 'quasar';
import { deleteWorkout, listWorkouts } from '@/db/workouts';
import type { Workout } from '@/types/workout';

/** 歷史清單與確認刪除。 */
export function useWorkoutHistory() {
  const $q = useQuasar();
  const workouts = shallowRef<Workout[]>([]);
  const loading = ref(true);
  const busy = ref(false);
  const error = ref('');
  async function reload() {
    loading.value = true;
    error.value = '';
    try {
      workouts.value = await listWorkouts();
    } catch {
      error.value = '無法讀取訓練紀錄，請稍後重試。';
    } finally {
      loading.value = false;
    }
  }
  onMounted(reload);
  function confirmDelete(workout: Workout) {
    if (busy.value) return;
    $q.dialog({
      title: '刪除訓練紀錄',
      message: `確定刪除「${workout.planName}／${workout.dayName}」的這次紀錄嗎？`,
      cancel: true,
      ok: { label: '刪除', color: 'negative' },
    }).onOk(() => {
      void remove(workout);
    });
  }
  async function remove(workout: Workout) {
    busy.value = true;
    try {
      await deleteWorkout(workout);
      await reload();
    } catch {
      error.value = '刪除失敗，紀錄可能已在其他分頁修改，請重新載入後重試。';
    } finally {
      busy.value = false;
    }
  }
  return { workouts, loading, busy, error, reload, confirmDelete };
}
