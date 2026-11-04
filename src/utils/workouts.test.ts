/** 訓練快照、輸入界限與統計正確性測試。 */
import { describe, expect, it } from 'vitest';
import { newPlan, newPlanDay, newPlanExercise } from './plans';
import {
  MAX_WORKOUT_SETS,
  newWorkout,
  updateWorkoutSet,
  workoutError,
  workoutSetError,
  workoutSummary,
} from './workouts';
import type { WorkoutSet } from '../types/workout';

function fixture() {
  const plan = newPlan('全身', 'single');
  const day = plan.days[0]!;
  day.exercises = [
    { ...newPlanExercise('push-up'), sets: 2 },
    { ...newPlanExercise('plank'), sets: 1, target: 30, targetUnit: 'seconds' },
  ];
  return { plan, day };
}
function set(patch: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set',
    weightKg: null,
    actual: null,
    effortKind: 'rir',
    effort: null,
    completed: false,
    ...patch,
  };
}

describe('訓練快照', () => {
  it('建立獨立實際紀錄，不因之後改課表而變更', () => {
    const { plan, day } = fixture();
    const workout = newWorkout(plan, day.id, null);
    day.exercises[0]!.target = 99;
    plan.name = '新課表';
    expect(workout.planName).toBe('全身');
    expect(workout.exercises[0]?.target).toBe(10);
    expect(workout.exercises[0]?.sets).toHaveLength(2);
    expect(workout.exercises[1]?.targetUnit).toBe('seconds');
    expect(workoutSummary(workout)).toEqual({ completed: 0, total: 3, volumeKg: 0 });
    expect(new Set(workout.exercises.flatMap((item) => item.sets.map((row) => row.id))).size).toBe(
      3,
    );
    expect(workoutError(workout)).toBeUndefined();
  });
  it('只複製選定的多日訓練日，保留廠區名稱快照', () => {
    const { plan } = fixture();
    plan.mode = 'multi';
    const day = { ...newPlanDay('拉'), exercises: [newPlanExercise('pull-up')] };
    plan.days.push(day);
    const gym = { id: 'gym', name: '廠區', inventory: {}, createdAt: 1, updatedAt: 1 };
    const workout = newWorkout(plan, day.id, gym);
    gym.name = '改名';
    expect(workout.dayName).toBe('拉');
    expect(workout.exercises.map((item) => item.exerciseId)).toEqual(['pull-up']);
    expect(workout.gymName).toBe('廠區');
  });
  it('拒絕不存在的訓練日與超大課表，避免大量配置組數', () => {
    const { plan, day } = fixture();
    expect(() => newWorkout(plan, 'missing', null)).toThrow();
    day.exercises[0]!.sets = MAX_WORKOUT_SETS + 1;
    expect(() => newWorkout(plan, day.id, null)).toThrow('500');
  });
});

describe('每組輸入', () => {
  it('允許草稿留白與徒手零重量，完成組必須填實際表現', () => {
    expect(workoutSetError(set())).toBeUndefined();
    expect(workoutSetError(set({ completed: true }))).toBeDefined();
    expect(workoutSetError(set({ completed: true, actual: 10, weightKg: 0 }))).toBeUndefined();
  });
  it.each([-1, NaN, Infinity])('拒絕不合法重量：%s', (weightKg) => {
    expect(workoutSetError(set({ weightKg }))).toBeDefined();
  });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    '拒絕不合法次數或秒數：%s',
    (actual) => {
      expect(workoutSetError(set({ actual }))).toBeDefined();
    },
  );
  it('RIR 為 0–10 整數，RPE 為 1–10 且允許半分', () => {
    for (const effort of [0, 5, 10]) expect(workoutSetError(set({ effort }))).toBeUndefined();
    for (const effort of [-1, 0.5, 11]) expect(workoutSetError(set({ effort }))).toBeDefined();
    for (const effort of [1, 8.5, 10])
      expect(workoutSetError(set({ effortKind: 'rpe', effort }))).toBeUndefined();
    for (const effort of [0, 8.3, 11, Infinity])
      expect(workoutSetError(set({ effortKind: 'rpe', effort }))).toBeDefined();
  });
});

describe('更新與統計', () => {
  it('只更新一組且不改動舊狀態，統計排除未完成組和計時動作', () => {
    const { plan, day } = fixture();
    const workout = newWorkout(plan, day.id, null);
    const first = workout.exercises[0]!.sets[0]!;
    const seconds = workout.exercises[1]!.sets[0]!;
    let updated = updateWorkoutSet(workout, first.id, {
      weightKg: 20,
      actual: 10,
      completed: true,
    });
    updated = updateWorkoutSet(updated, seconds.id, { weightKg: 30, actual: 45, completed: true });
    expect(first.completed).toBe(false);
    expect(workoutSummary(updated)).toEqual({ completed: 2, total: 3, volumeKg: 200 });
    expect(workoutError(updated)).toBeUndefined();
    expect(workoutError(updateWorkoutSet(updated, first.id, { actual: -1 }))).toContain('第 1 組');
  });
});
