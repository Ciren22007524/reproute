/** 課表建立、驗證與不可變排序工具，不讀寫資料庫。 */
import { exerciseById } from '../data/exercises';
import type { PlanDay, PlanExercise, PlanMode, TrainingPlan } from '../types/plan';

/** 建立空白訓練日，待使用者加入動作。 */
export function newPlanDay(name: string): PlanDay {
  return { id: crypto.randomUUID(), name, exercises: [] };
}

/** 建立本機課表草稿；3 組 10 次是可修改的輸入起點，不是自動處方。 */
export function newPlan(name: string, mode: PlanMode): TrainingPlan {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    mode,
    days: [newPlanDay(mode === 'single' ? '本堂訓練' : '第 1 天')],
    createdAt: now,
    updatedAt: now,
  };
}

/** 加入動作時為該列產生獨立 id。 */
export function newPlanExercise(exerciseId: string): PlanExercise {
  if (!exerciseById.has(exerciseId)) throw new Error('Unknown exercise');
  return { id: crypto.randomUUID(), exerciseId, sets: 3, target: 10, targetUnit: 'reps' };
}

/** 取得新的排列；範圍錯誤時維持原順序，不刪除任何元素。 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  )
    return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

/** 僅更新指定訓練日，保留其他天與原物件。 */
export function updatePlanDay(
  plan: TrainingPlan,
  dayId: string,
  update: (day: PlanDay) => PlanDay,
): TrainingPlan {
  return { ...plan, days: plan.days.map((day) => (day.id === dayId ? update(day) : day)) };
}

/** 儲存前驗證全部資料；空白草稿可以編輯，但不可儲存。 */
export function planError(plan: TrainingPlan): string | undefined {
  if (!plan.name.trim()) return '請填寫課表名稱。';
  if (
    !['single', 'multi'].includes(plan.mode) ||
    !plan.days.length ||
    (plan.mode === 'single' && plan.days.length !== 1)
  )
    return '課表模式與訓練日數不符。';
  const ids = new Set<string>();
  for (const day of plan.days) {
    if (!day.id || ids.has(day.id)) return '訓練日資料重複，請重新開啟課表。';
    ids.add(day.id);
    if (!day.name.trim()) return '請填寫每個訓練日的名稱。';
    if (!day.exercises.length) return '每個訓練日至少需要一個動作。';
    for (const item of day.exercises) {
      if (!item.id || ids.has(item.id)) return '動作資料重複，請重新開啟課表。';
      ids.add(item.id);
      if (!exerciseById.has(item.exerciseId)) return '有動作不在目前的動作資料庫中。';
      if (
        !Number.isSafeInteger(item.sets) ||
        item.sets < 1 ||
        !Number.isSafeInteger(item.target) ||
        item.target < 1 ||
        !['reps', 'seconds'].includes(item.targetUnit)
      )
        return '組數與每組目標必須是大於零的整數。';
    }
  }
  return undefined;
}
