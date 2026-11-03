/** 課表清單、模式選擇與刪除確認；頁面不直接存取資料庫。 */
import { onMounted, ref, shallowRef } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { deletePlan, listPlans, PlanConflictError } from '@/db/plans';
import type { PlanMode, TrainingPlan } from '@/types/plan';

/** 載入與管理本機課表。 */
export function usePlanList() {
  const $q = useQuasar();
  const router = useRouter();
  const plans = shallowRef<TrainingPlan[]>([]);
  const loading = ref(true);
  const error = ref('');
  const creating = ref(false);
  const deleting = ref(false);

  async function reload() {
    loading.value = true;
    error.value = '';
    try {
      plans.value = await listPlans();
    } catch {
      error.value = '無法讀取課表，請確認瀏覽器可儲存資料後重試。';
    } finally {
      loading.value = false;
    }
  }
  onMounted(reload);

  /** 模式只影響課表結構，不自動建立訓練紀錄。 */
  async function create(mode: PlanMode) {
    creating.value = false;
    await router.push({ path: '/plans/new', query: { mode } });
  }

  /** 明確確認後軟刪除，失敗時保持清單並提供重試。 */
  function confirmDelete(plan: TrainingPlan) {
    if (deleting.value) return;
    $q.dialog({
      title: '刪除課表',
      message: `確定要刪除「${plan.name}」嗎？`,
      cancel: true,
      ok: { label: '刪除', color: 'negative' },
    }).onOk(() => {
      void remove(plan);
    });
  }
  async function remove(plan: TrainingPlan) {
    deleting.value = true;
    try {
      await deletePlan(plan);
      await reload();
    } catch (cause) {
      error.value =
        cause instanceof PlanConflictError
          ? '課表已在其他分頁修改，請重新載入後再操作。'
          : '刪除失敗，請稍後重試。';
    } finally {
      deleting.value = false;
    }
  }
  return { plans, loading, error, creating, deleting, reload, create, confirmDelete };
}
