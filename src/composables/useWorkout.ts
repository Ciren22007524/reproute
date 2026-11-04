/** 免登入訓練流程：選課表、保存每組、接續、結束與離開保護。 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { listPlans } from '@/db/plans';
import { listGyms } from '@/db/gyms';
import {
  ActiveWorkoutError,
  deleteWorkout,
  getActiveWorkout,
  saveWorkout,
  startWorkout,
  WorkoutConflictError,
} from '@/db/workouts';
import type { Gym } from '@/types/domain';
import type { TrainingPlan } from '@/types/plan';
import type { Workout, WorkoutSet } from '@/types/workout';
import { updateWorkoutSet, workoutError, workoutSummary } from '@/utils/workouts';

/** 提供今日訓練頁所需狀態；只有資料存取層會碰 IndexedDB。 */
export function useWorkout() {
  const $q = useQuasar();
  const router = useRouter();
  const plans = shallowRef<TrainingPlan[]>([]);
  const gyms = shallowRef<Gym[]>([]);
  const planId = ref<string | null>(null);
  const dayId = ref<string | null>(null);
  const gymId = ref<string | null>(null);
  const workout = shallowRef<Workout | null>(null);
  const loading = ref(true);
  const busy = ref(false);
  const error = ref('');
  const conflict = ref(false);
  const snapshot = ref('');
  const dirty = computed(() => !!workout.value && JSON.stringify(workout.value) !== snapshot.value);
  const planOptions = computed(() =>
    plans.value.map((item) => ({
      label: `${item.name}（${item.mode === 'single' ? '單堂' : '多日'}）`,
      value: item.id,
    })),
  );
  const dayOptions = computed(
    () =>
      plans.value
        .find((item) => item.id === planId.value)
        ?.days.map((day) => ({ label: day.name, value: day.id })) ?? [],
  );
  const gymOptions = computed(() => gyms.value.map((gym) => ({ label: gym.name, value: gym.id })));
  const summary = computed(() => (workout.value ? workoutSummary(workout.value) : null));
  watch(planId, () => {
    dayId.value = dayOptions.value[0]?.value ?? null;
  });

  function accept(value: Workout | null) {
    workout.value = value;
    snapshot.value = value ? JSON.stringify(value) : '';
    conflict.value = false;
  }
  async function load() {
    loading.value = true;
    error.value = '';
    try {
      const [active, allPlans, allGyms] = await Promise.all([
        getActiveWorkout(),
        listPlans(),
        listGyms(),
      ]);
      plans.value = allPlans;
      gyms.value = allGyms;
      accept(active ?? null);
    } catch {
      error.value = '無法讀取本機資料，請確認瀏覽器可儲存資料後重試。';
    } finally {
      loading.value = false;
    }
  }
  onMounted(load);
  async function start() {
    if (!planId.value || !dayId.value || busy.value) return;
    busy.value = true;
    error.value = '';
    try {
      accept(await startWorkout(planId.value, dayId.value, gymId.value));
    } catch (cause) {
      if (cause instanceof ActiveWorkoutError) {
        await load();
        $q.notify({ message: '已有進行中的訓練，已為你載入', type: 'info' });
      } else error.value = '無法開始訓練，請重新載入並確認課表每堂不超過 500 組。';
    } finally {
      busy.value = false;
    }
  }
  function edit(
    setId: string,
    field: 'weightKg' | 'actual' | 'effort' | 'effortKind',
    value: string | number | null,
  ) {
    if (!workout.value || busy.value) return;
    const patch: Partial<WorkoutSet> =
      field === 'effortKind'
        ? { effortKind: value === 'rpe' ? 'rpe' : 'rir', effort: null }
        : { [field]: value === null || value === '' ? null : Number(value) };
    workout.value = updateWorkoutSet(workout.value, setId, patch);
    if (!conflict.value) error.value = '';
  }
  async function persist(finish = false) {
    if (!workout.value || busy.value || conflict.value) return;
    error.value = workoutError(workout.value) ?? '';
    if (error.value) return;
    busy.value = true;
    try {
      const saved = await saveWorkout(workout.value, workout.value.updatedAt, finish);
      accept(saved);
      if (finish) await router.push(`/history/${saved.id}`);
      else $q.notify({ type: 'positive', message: '訓練進度已儲存' });
    } catch (cause) {
      conflict.value = cause instanceof WorkoutConflictError;
      error.value = conflict.value
        ? '其他分頁已更新或結束此訓練。草稿保留，請確認需要的內容後重新載入。'
        : '儲存失敗，草稿保留，請確認儲存空間後重試。';
    } finally {
      busy.value = false;
    }
  }
  /** 完成本組時保存整份有效草稿；失敗時仍可用儲存進度重試。 */
  async function toggle(setId: string) {
    if (!workout.value || busy.value || conflict.value) return;
    const set = workout.value.exercises
      .flatMap((item) => item.sets)
      .find((item) => item.id === setId);
    if (!set) return;
    const next = updateWorkoutSet(workout.value, setId, { completed: !set.completed });
    error.value = workoutError(next) ?? '';
    if (error.value) return;
    workout.value = next;
    await persist();
  }
  function finish() {
    if (!summary.value?.completed) {
      error.value = '至少完成一組後才能結束訓練。';
      return;
    }
    const remaining = summary.value.total - summary.value.completed;
    $q.dialog({
      title: '結束訓練',
      message: remaining
        ? `還有 ${remaining} 組未完成，仍要結束並保留已完成的紀錄嗎？`
        : '將這次訓練保存到歷史紀錄？',
      cancel: true,
      ok: { label: '結束並保存' },
    }).onOk(() => {
      void persist(true);
    });
  }
  function discard() {
    if (!workout.value || busy.value) return;
    $q.dialog({
      title: '放棄訓練',
      message: '確定放棄這次訓練嗎？這次內容不會列入歷史紀錄。',
      cancel: true,
      ok: { label: '放棄', color: 'negative' },
    }).onOk(() => {
      void remove();
    });
  }
  async function remove() {
    if (!workout.value || busy.value) return;
    busy.value = true;
    try {
      await deleteWorkout(workout.value);
      accept(null);
      error.value = '';
    } catch {
      error.value = '無法放棄，訓練可能已在其他分頁修改，請重新載入後再操作。';
    } finally {
      busy.value = false;
    }
  }
  function confirmLeave(): boolean | Promise<boolean> {
    if (!dirty.value) return true;
    if (busy.value) return false;
    return new Promise((resolve) => {
      $q.dialog({
        title: '尚未儲存',
        message: '這些修改尚未儲存，確定要捨棄嗎？已儲存的訓練仍可接續。',
        cancel: { label: '繼續編輯' },
        ok: { label: '捨棄修改', color: 'negative' },
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false))
        .onDismiss(() => resolve(false));
    });
  }
  async function reload() {
    if (await confirmLeave()) await load();
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  onBeforeRouteLeave(confirmLeave);
  onMounted(() => window.addEventListener('beforeunload', beforeUnload));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
  return {
    planId,
    dayId,
    gymId,
    planOptions,
    dayOptions,
    gymOptions,
    workout,
    loading,
    busy,
    error,
    conflict,
    dirty,
    summary,
    start,
    edit,
    toggle,
    persist,
    finish,
    discard,
    reload,
  };
}
