/** 共用課表編輯草稿、儲存與離開保護；所有變更替換整份狀態。 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { getPlan, PlanConflictError, savePlan } from '@/db/plans';
import type { PlanDay, PlanExercise, TrainingPlan } from '@/types/plan';
import {
  moveItem,
  newPlan,
  newPlanDay,
  newPlanExercise,
  planError,
  updatePlanDay,
} from '@/utils/plans';

/** 依路由 id 載入草稿；new 代表尚未寫入資料庫的新課表。 */
export function usePlanEditor(id: () => string) {
  const $q = useQuasar();
  const router = useRouter();
  const route = useRoute();
  const plan = shallowRef<TrainingPlan | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref('');
  const conflict = ref(false);
  const notFound = ref(false);
  const snapshot = ref('');
  const expectedVersion = ref<number | null>(null);
  const dirty = computed(() => !!plan.value && JSON.stringify(plan.value) !== snapshot.value);
  let loadVersion = 0;

  async function load() {
    const version = ++loadVersion;
    loading.value = true;
    error.value = '';
    conflict.value = false;
    notFound.value = false;
    plan.value = null;
    try {
      const value =
        id() === 'new'
          ? newPlan('', route.query.mode === 'multi' ? 'multi' : 'single')
          : await getPlan(id());
      if (version !== loadVersion) return;
      if (!value) {
        notFound.value = true;
        return;
      }
      plan.value = value;
      expectedVersion.value = id() === 'new' ? null : value.updatedAt;
      snapshot.value = JSON.stringify(value);
    } catch {
      if (version === loadVersion) error.value = '無法讀取課表，請稍後重試。';
    } finally {
      if (version === loadVersion) loading.value = false;
    }
  }
  watch(
    id,
    () => {
      void load();
    },
    { immediate: true },
  );

  function change(update: (value: TrainingPlan) => TrainingPlan) {
    if (!plan.value || saving.value) return;
    plan.value = update(plan.value);
    if (!conflict.value) error.value = '';
  }
  function rename(name: string | number | null) {
    change((value) => ({ ...value, name: String(name ?? '') }));
  }
  function changeDay(dayId: string, update: (day: PlanDay) => PlanDay) {
    change((value) => updatePlanDay(value, dayId, update));
  }
  function renameDay(dayId: string, name: string | number | null) {
    changeDay(dayId, (day) => ({ ...day, name: String(name ?? '') }));
  }
  function addDay() {
    change((value) =>
      value.mode === 'multi'
        ? { ...value, days: [...value.days, newPlanDay(`第 ${value.days.length + 1} 天`)] }
        : value,
    );
  }
  function removeDay(dayId: string) {
    if (!plan.value || plan.value.mode !== 'multi' || plan.value.days.length <= 1) return;
    $q.dialog({
      title: '刪除訓練日',
      message: '確定移除此訓練日與其中的動作嗎？儲存後才會更新課表。',
      cancel: true,
      ok: { label: '移除', color: 'negative' },
    }).onOk(() =>
      change((value) => ({ ...value, days: value.days.filter((day) => day.id !== dayId) })),
    );
  }
  function moveDay(index: number, offset: number) {
    change((value) => ({ ...value, days: moveItem(value.days, index, index + offset) }));
  }
  function addExercise(dayId: string, exerciseId: string) {
    changeDay(dayId, (day) => ({
      ...day,
      exercises: [...day.exercises, newPlanExercise(exerciseId)],
    }));
  }
  function removeExercise(dayId: string, itemId: string) {
    changeDay(dayId, (day) => ({
      ...day,
      exercises: day.exercises.filter((item) => item.id !== itemId),
    }));
  }
  function editExercise(
    dayId: string,
    itemId: string,
    field: 'sets' | 'target' | 'targetUnit',
    input: string | number | null,
  ) {
    const patch: Partial<PlanExercise> =
      field === 'targetUnit'
        ? { targetUnit: input === 'seconds' ? 'seconds' : 'reps' }
        : { [field]: input === null || input === '' ? 0 : Number(input) };
    changeDay(dayId, (day) => ({
      ...day,
      exercises: day.exercises.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  }
  function moveExercise(dayId: string, fromId: string, toId: string) {
    changeDay(dayId, (day) => ({
      ...day,
      exercises: moveItem(
        day.exercises,
        day.exercises.findIndex((item) => item.id === fromId),
        day.exercises.findIndex((item) => item.id === toId),
      ),
    }));
  }

  async function save() {
    if (!plan.value || saving.value || conflict.value) return;
    error.value = planError(plan.value) ?? '';
    if (error.value) return;
    saving.value = true;
    try {
      const stored = await savePlan(plan.value, expectedVersion.value);
      plan.value = stored;
      expectedVersion.value = stored.updatedAt;
      snapshot.value = JSON.stringify(stored);
      $q.notify({ type: 'positive', message: '課表已儲存到這台裝置' });
      if (id() === 'new') await router.replace(`/plans/${stored.id}`);
    } catch (cause) {
      conflict.value = cause instanceof PlanConflictError;
      error.value = conflict.value
        ? '課表已在其他分頁修改或刪除。草稿仍保留，請先複製需要的內容，再重新載入。'
        : '儲存失敗，草稿仍保留，請確認瀏覽器可儲存資料後重試。';
    } finally {
      saving.value = false;
    }
  }
  function confirmLeave(): boolean | Promise<boolean> {
    if (!dirty.value) return true;
    if (saving.value) return false;
    return new Promise((resolve) => {
      $q.dialog({
        title: '尚未儲存',
        message: '離開會捨棄這次修改，要繼續嗎？',
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
  onBeforeRouteUpdate(confirmLeave);
  onMounted(() => window.addEventListener('beforeunload', beforeUnload));
  onBeforeUnmount(() => {
    loadVersion++;
    window.removeEventListener('beforeunload', beforeUnload);
  });
  return {
    plan,
    loading,
    saving,
    error,
    conflict,
    notFound,
    dirty,
    rename,
    renameDay,
    addDay,
    removeDay,
    moveDay,
    addExercise,
    removeExercise,
    editExercise,
    moveExercise,
    save,
    reload,
  };
}
