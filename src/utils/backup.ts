/** 完整備份格式與不可信 JSON 驗證；不包含登入、cookie 或雲端憑證。 */
import type { Gym } from '../types/domain';
import type { PlanDay, PlanExercise, TrainingPlan } from '../types/plan';
import type { Workout, WorkoutExercise, WorkoutSet } from '../types/workout';
import { parseGymJson } from './importGym';
import { planError } from './plans';
import { MAX_WORKOUT_SETS, workoutError, workoutSummary } from './workouts';

/** 完整備份最大 10 MB。 */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
/** 版本化的完整本機備份，只包含尚未刪除的資料。 */
export interface AppBackup {
  /** 固定的檔案識別。 */
  format: 'reproute-backup';
  /** 不相容格式必須提升版本。 */
  version: 1;
  /** 匯出時間（毫秒）。 */
  exportedAt: number;
  /** 廠區清點。 */
  gyms: Gym[];
  /** 完整課表。 */
  plans: TrainingPlan[];
  /** 進行中與已完成訓練。 */
  workouts: Workout[];
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid object');
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid string');
  return value;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid number');
  return value;
}
function time(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Invalid timestamp');
  return result;
}
function nullableNumber(value: unknown): number | null {
  return value === null ? null : number(value);
}
function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 10000) throw new Error('Invalid array');
  return value;
}
function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate IDs');
}
function unit(value: unknown): 'reps' | 'seconds' {
  if (value !== 'reps' && value !== 'seconds') throw new Error('Invalid unit');
  return value;
}
function planExercise(value: unknown): PlanExercise {
  const raw = record(value);
  return {
    id: text(raw.id),
    exerciseId: text(raw.exerciseId),
    sets: number(raw.sets),
    target: number(raw.target),
    targetUnit: unit(raw.targetUnit),
  };
}
function planDay(value: unknown): PlanDay {
  const raw = record(value);
  return {
    id: text(raw.id),
    name: text(raw.name),
    exercises: array(raw.exercises).map(planExercise),
  };
}
function plan(value: unknown): TrainingPlan {
  const raw = record(value);
  if (raw.mode !== 'single' && raw.mode !== 'multi') throw new Error('Invalid mode');
  const result: TrainingPlan = {
    id: text(raw.id),
    name: text(raw.name),
    mode: raw.mode,
    createdAt: time(raw.createdAt),
    updatedAt: time(raw.updatedAt),
    days: array(raw.days).map(planDay),
  };
  if (result.updatedAt < result.createdAt || planError(result)) throw new Error('Invalid plan');
  return result;
}
function workoutSet(value: unknown): WorkoutSet {
  const raw = record(value);
  if (typeof raw.completed !== 'boolean' || (raw.effortKind !== 'rir' && raw.effortKind !== 'rpe'))
    throw new Error('Invalid set');
  return {
    id: text(raw.id),
    completed: raw.completed,
    effortKind: raw.effortKind,
    effort: nullableNumber(raw.effort),
    weightKg: nullableNumber(raw.weightKg),
    actual: nullableNumber(raw.actual),
  };
}
function workoutExercise(value: unknown): WorkoutExercise {
  const raw = record(value);
  const result: WorkoutExercise = {
    id: text(raw.id),
    exerciseId: text(raw.exerciseId),
    name: text(raw.name),
    target: number(raw.target),
    targetUnit: unit(raw.targetUnit),
    sets: array(raw.sets).map(workoutSet),
  };
  if (!Number.isSafeInteger(result.target) || result.target <= 0 || !result.sets.length)
    throw new Error('Invalid exercise');
  return result;
}
function workout(value: unknown): Workout {
  const raw = record(value);
  if (raw.status !== 'active' && raw.status !== 'completed') throw new Error('Invalid status');
  const result: Workout = {
    id: text(raw.id),
    planId: text(raw.planId),
    dayId: text(raw.dayId),
    planName: text(raw.planName),
    dayName: text(raw.dayName),
    gymId: nullableText(raw.gymId),
    gymName: nullableText(raw.gymName),
    status: raw.status,
    startedAt: time(raw.startedAt),
    updatedAt: time(raw.updatedAt),
    endedAt: raw.endedAt === null ? null : time(raw.endedAt),
    exercises: array(raw.exercises).map(workoutExercise),
  };
  if (!result.exercises.length || result.updatedAt < result.startedAt || workoutError(result))
    throw new Error('Invalid workout');
  const summary = workoutSummary(result);
  if (
    summary.total > MAX_WORKOUT_SETS ||
    (result.status === 'active'
      ? result.endedAt !== null
      : result.endedAt === null ||
        result.endedAt < result.startedAt ||
        result.endedAt > result.updatedAt ||
        !summary.completed)
  )
    throw new Error('Invalid completion');
  unique(result.exercises.flatMap((item) => [item.id, ...item.sets.map((set) => set.id)]));
  return result;
}

/** 驗證全部內容才提供預覽，未知版本或損壞資料不部分匯入。 */
export function parseBackup(json: string): AppBackup {
  if (new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES)
    throw new Error('Backup too large');
  const raw = record(JSON.parse(json));
  if (raw.format !== 'reproute-backup' || raw.version !== 1) throw new Error('Unknown format');
  const result: AppBackup = {
    format: 'reproute-backup',
    version: 1,
    exportedAt: time(raw.exportedAt),
    gyms: array(raw.gyms).map((item) => parseGymJson(JSON.stringify(item))),
    plans: array(raw.plans).map(plan),
    workouts: array(raw.workouts).map(workout),
  };
  for (const items of [result.gyms, result.plans, result.workouts])
    unique(items.map((item) => item.id));
  if (result.workouts.filter((item) => item.status === 'active').length > 1)
    throw new Error('Multiple active workouts');
  return result;
}

/** 為備份建立全部新 id，來源已刪除時也不連結到本機同 id 的其他資料。 */
export function backupCopies(backup: AppBackup): AppBackup {
  const source = structuredClone(backup);
  const now = Date.now();
  const gyms = new Map(source.gyms.map((item) => [item.id, crypto.randomUUID()]));
  const plans = new Map(source.plans.map((item) => [item.id, crypto.randomUUID()]));
  const days = new Map(
    source.plans.flatMap((item) =>
      item.days.map((day) => [JSON.stringify([item.id, day.id]), crypto.randomUUID()]),
    ),
  );
  const remap = (map: Map<string, string>, id: string) => {
    let next = map.get(id);
    if (!next) {
      next = crypto.randomUUID();
      map.set(id, next);
    }
    return next;
  };
  return {
    ...source,
    gyms: source.gyms.map((gym) => ({
      ...gym,
      id: remap(gyms, gym.id),
      name: `${gym.name}（匯入）`,
      updatedAt: Math.max(now, gym.updatedAt),
    })),
    plans: source.plans.map((item) => ({
      ...item,
      id: remap(plans, item.id),
      name: `${item.name}（匯入）`,
      updatedAt: Math.max(now, item.updatedAt),
      days: item.days.map((day) => ({
        ...day,
        id: remap(days, JSON.stringify([item.id, day.id])),
        exercises: day.exercises.map((exercise) => ({ ...exercise, id: crypto.randomUUID() })),
      })),
    })),
    workouts: source.workouts.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      planId: remap(plans, item.planId),
      dayId: remap(days, JSON.stringify([item.planId, item.dayId])),
      gymId: item.gymId ? remap(gyms, item.gymId) : null,
      updatedAt: Math.max(now, item.updatedAt),
      exercises: item.exercises.map((exercise) => ({
        ...exercise,
        id: crypto.randomUUID(),
        sets: exercise.sets.map((set) => ({ ...set, id: crypto.randomUUID() })),
      })),
    })),
  };
}
