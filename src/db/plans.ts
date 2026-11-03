/** 課表本機存取；交易內檢查版本，避免另一分頁的修改被靜默覆蓋。 */
import { db } from './index';
import type { TrainingPlan } from '@/types/plan';
import { planError } from '@/utils/plans';

/** 跨分頁已修改或刪除，保留草稿並要求使用者重新確認。 */
export class PlanConflictError extends Error {}

/** 最近更新的課表排在前面，隱藏軟刪除資料。 */
export function listPlans(): Promise<TrainingPlan[]> {
  return db.plans
    .orderBy('updatedAt')
    .reverse()
    .filter((plan) => !plan.deletedAt)
    .toArray();
}

/** 已刪除的課表視為不存在。 */
export async function getPlan(id: string): Promise<TrainingPlan | undefined> {
  const plan = await db.plans.get(id);
  return plan?.deletedAt ? undefined : plan;
}

/** 首次以 add 儲存；更新須與載入版本一致，失敗不改動舊資料。 */
export async function savePlan(
  draft: TrainingPlan,
  expectedUpdatedAt: number | null,
): Promise<TrainingPlan> {
  const error = planError(draft);
  if (error) throw new Error(error);
  const copy = JSON.parse(JSON.stringify(draft)) as TrainingPlan;
  copy.name = copy.name.trim();
  copy.days = copy.days.map((day) => ({ ...day, name: day.name.trim() }));
  return db.transaction('rw', db.plans, async () => {
    const current = await db.plans.get(copy.id);
    if (
      expectedUpdatedAt === null
        ? current !== undefined
        : !current || !!current.deletedAt || current.updatedAt !== expectedUpdatedAt
    )
      throw new PlanConflictError();
    copy.updatedAt = Math.max(Date.now(), (current?.updatedAt ?? 0) + 1);
    if (expectedUpdatedAt === null) await db.plans.add(copy);
    else await db.plans.put(copy);
    return copy;
  });
}

/** 刪除時保留標記，以便之後同步；不接受過期的清單版本。 */
export async function deletePlan(plan: TrainingPlan): Promise<void> {
  await db.transaction('rw', db.plans, async () => {
    const current = await db.plans.get(plan.id);
    if (!current || current.deletedAt || current.updatedAt !== plan.updatedAt)
      throw new PlanConflictError();
    const now = Math.max(Date.now(), current.updatedAt + 1);
    await db.plans.put({ ...current, updatedAt: now, deletedAt: now });
  });
}
