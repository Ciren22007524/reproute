/** 本機訓練存取、唯一進行中紀錄與跨分頁版本保護。 */
import { db } from './index';
import type { Workout } from '@/types/workout';
import { newWorkout, workoutError, workoutSummary } from '@/utils/workouts';

/** 另一個分頁已更新訓練，拒絕覆蓋。 */
export class WorkoutConflictError extends Error {}
/** 已有進行中的訓練，應先接續或放棄。 */
export class ActiveWorkoutError extends Error {}

/** 載入進行中訓練；重新整理可接續。 */
export function getActiveWorkout(): Promise<Workout | undefined> {
  return db.workouts.where('status').equals('active').first();
}
/** 完整歷史，最新訓練在前，忽略已刪除資料。 */
export function listWorkouts(): Promise<Workout[]> {
  return db.workouts
    .orderBy('startedAt')
    .reverse()
    .filter((item) => item.status === 'completed' && !item.deletedAt)
    .toArray();
}
/** 取得仍可查看的紀錄。 */
export async function getWorkout(id: string): Promise<Workout | undefined> {
  const item = await db.workouts.get(id);
  return item?.deletedAt || item?.status === 'discarded' ? undefined : item;
}
/** 交易內重讀課表與廠區，並防止同時建立兩堂訓練。 */
export async function startWorkout(
  planId: string,
  dayId: string,
  gymId: string | null,
): Promise<Workout> {
  return db.transaction('rw', db.workouts, db.plans, db.gyms, async () => {
    if (await db.workouts.where('status').equals('active').first()) throw new ActiveWorkoutError();
    const plan = await db.plans.get(planId);
    if (!plan || plan.deletedAt) throw new Error('課表已不存在，請重新載入。');
    const gym = gymId ? await db.gyms.get(gymId) : undefined;
    if (gymId && !gym) throw new Error('廠區已不存在，請重新載入。');
    const workout = newWorkout(plan, dayId, gym ?? null);
    await db.workouts.add(workout);
    return workout;
  });
}
/** 儲存進度或完成訓練；已結束紀錄不可被舊分頁改寫。 */
export async function saveWorkout(
  draft: Workout,
  expectedUpdatedAt: number,
  finish = false,
): Promise<Workout> {
  const error = workoutError(draft);
  if (error) throw new Error(error);
  if (finish && !workoutSummary(draft).completed) throw new Error('至少完成一組後才能結束訓練。');
  const copy = JSON.parse(JSON.stringify(draft)) as Workout;
  return db.transaction('rw', db.workouts, async () => {
    const current = await db.workouts.get(copy.id);
    if (
      !current ||
      current.deletedAt ||
      current.status !== 'active' ||
      current.updatedAt !== expectedUpdatedAt
    )
      throw new WorkoutConflictError();
    copy.updatedAt = Math.max(Date.now(), current.updatedAt + 1);
    copy.status = finish ? 'completed' : 'active';
    copy.endedAt = finish ? copy.updatedAt : null;
    await db.workouts.put(copy);
    return copy;
  });
}
/** 放棄進行中訓練或刪除歷史，保留軟刪除標記。 */
export async function deleteWorkout(workout: Workout): Promise<void> {
  await db.transaction('rw', db.workouts, async () => {
    const current = await db.workouts.get(workout.id);
    if (!current || current.deletedAt || current.updatedAt !== workout.updatedAt)
      throw new WorkoutConflictError();
    const now = Math.max(Date.now(), current.updatedAt + 1);
    await db.workouts.put({
      ...current,
      status: current.status === 'active' ? 'discarded' : current.status,
      updatedAt: now,
      deletedAt: now,
    });
  });
}
