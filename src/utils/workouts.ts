/** 訓練快照、數值驗證與統計，不依賴資料庫或登入。 */
import { exerciseById } from '../data/exercises';
import type { Gym } from '../types/domain';
import type { TrainingPlan } from '../types/plan';
import type { Workout, WorkoutSet } from '../types/workout';
import { planError } from './plans';

/** 開始時限制單堂總組數，避免異常課表耗盡瀏覽器資源。 */
export const MAX_WORKOUT_SETS = 500;

/** 複製選定訓練日，保留獨立的實際紀錄與顯示名稱。 */
export function newWorkout(plan: TrainingPlan, dayId: string, gym: Gym | null): Workout {
  const error = planError(plan);
  if (error) throw new Error(error);
  const day = plan.days.find((item) => item.id === dayId);
  if (!day) throw new Error('找不到選定的訓練日。');
  if (day.exercises.reduce((sum, item) => sum + item.sets, 0) > MAX_WORKOUT_SETS)
    throw new Error('每堂最多 500 組，請先調整課表。');
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    planId: plan.id,
    dayId,
    planName: plan.name,
    dayName: day.name,
    gymId: gym?.id ?? null,
    gymName: gym?.name ?? null,
    status: 'active',
    startedAt: now,
    updatedAt: now,
    endedAt: null,
    exercises: day.exercises.map((item) => ({
      id: crypto.randomUUID(),
      exerciseId: item.exerciseId,
      name: exerciseById.get(item.exerciseId)!.name,
      target: item.target,
      targetUnit: item.targetUnit,
      sets: Array.from({ length: item.sets }, () => ({
        id: crypto.randomUUID(),
        weightKg: null,
        actual: null,
        effortKind: 'rir',
        effort: null,
        completed: false,
      })),
    })),
  };
}

/** 驗證已填數值；尚未完成的組可留白，但不能儲存不合法數字。 */
export function workoutSetError(set: WorkoutSet): string | undefined {
  if (set.weightKg !== null && (!Number.isFinite(set.weightKg) || set.weightKg < 0))
    return '重量必須是零或正數。';
  if (set.actual !== null && (!Number.isSafeInteger(set.actual) || set.actual <= 0))
    return '實際次數或秒數必須是大於零的整數。';
  if (set.completed && set.actual === null) return '完成本組前，請填寫實際次數或秒數。';
  if (!['rir', 'rpe'].includes(set.effortKind)) return '請選擇 RIR 或 RPE。';
  if (
    set.effort !== null &&
    (!Number.isFinite(set.effort) ||
      (set.effortKind === 'rir'
        ? !Number.isInteger(set.effort) || set.effort < 0 || set.effort > 10
        : set.effort < 1 || set.effort > 10 || !Number.isInteger(set.effort * 2)))
  )
    return 'RIR 請填 0–10 的整數；RPE 請填 1–10，可用 0.5 間隔。';
  return undefined;
}

/** 找到第一個需修正的組，不部分儲存。 */
export function workoutError(workout: Workout): string | undefined {
  for (const exercise of workout.exercises)
    for (const [index, set] of exercise.sets.entries()) {
      const error = workoutSetError(set);
      if (error) return `${exercise.name}第 ${index + 1} 組：${error}`;
    }
  return undefined;
}

/** 僅更新一組，避免污染課表、其他動作與舊狀態。 */
export function updateWorkoutSet(
  workout: Workout,
  setId: string,
  patch: Partial<WorkoutSet>,
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
    })),
  };
}

/** 只計入完成的組；計時動作不混入公斤次數總量。 */
export function workoutSummary(workout: Workout) {
  let completed = 0;
  let total = 0;
  let volumeKg = 0;
  for (const exercise of workout.exercises)
    for (const set of exercise.sets) {
      total++;
      if (set.completed) {
        completed++;
        if (exercise.targetUnit === 'reps') volumeKg += (set.weightKg ?? 0) * (set.actual ?? 0);
      }
    }
  return { completed, total, volumeKg };
}
