/** 不可信備份驗證與還原副本關聯測試，避免覆蓋或誤連結原資料。 */
import { describe, expect, it } from 'vitest';
import { backupCopies, MAX_BACKUP_BYTES, parseBackup, type AppBackup } from './backup';
import { newPlan, newPlanExercise } from './plans';
import { newWorkout, updateWorkoutSet } from './workouts';

function fixture(): AppBackup {
  const plan = newPlan('課表', 'single');
  plan.days[0]!.exercises = [newPlanExercise('push-up')];
  const gym = {
    id: 'gym',
    name: '廠區',
    inventory: { dumbbell: { count: 2, maxWeightKg: 40 } },
    createdAt: 1,
    updatedAt: 2,
  };
  let workout = newWorkout(plan, plan.days[0]!.id, gym);
  workout = updateWorkoutSet(workout, workout.exercises[0]!.sets[0]!.id, {
    actual: 10,
    weightKg: 20,
    completed: true,
  });
  return {
    format: 'reproute-backup',
    version: 1,
    exportedAt: Date.now(),
    gyms: [gym],
    plans: [plan],
    workouts: [workout],
  };
}

describe('完整備份驗證', () => {
  it('即使其他欄位完整，仍拒絕未知版本與格式', () => {
    const backup = fixture();
    expect(() => parseBackup(JSON.stringify({ ...backup, version: 2 }))).toThrow('Unknown format');
    expect(() => parseBackup(JSON.stringify({ ...backup, format: 'other-app' }))).toThrow(
      'Unknown format',
    );
  });
  it('完整往返保留課表、進行中訓練與所有組資料', () => {
    const backup = fixture();
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });
  it('接受空備份，明確排除未知欄位與認證資訊', () => {
    const backup = {
      format: 'reproute-backup',
      version: 1,
      exportedAt: 0,
      gyms: [],
      plans: [],
      workouts: [],
    };
    expect(parseBackup(JSON.stringify({ ...backup, authorization: 'not-included' }))).toEqual(
      backup,
    );
  });
  it.each([
    null,
    [],
    {},
    { format: 'other', version: 1 },
    { format: 'reproute-backup', version: 2 },
  ])('拒絕未知格式：%j', (raw) => {
    expect(() => parseBackup(JSON.stringify(raw))).toThrow();
  });
  it('拒絕單一廠區檔、損壞 JSON 與超過大小限制的檔案', () => {
    expect(() => parseBackup(JSON.stringify(fixture().gyms[0]))).toThrow();
    expect(() => parseBackup('{')).toThrow();
    expect(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toThrow('too large');
  });
  it('任一資料不合法即整份拒絕，不部分修復或忽略', () => {
    const backup = fixture();
    backup.plans[0]!.days[0]!.exercises[0]!.sets = -1;
    expect(() => parseBackup(JSON.stringify(backup))).toThrow();
    const badWorkout = fixture();
    badWorkout.workouts[0]!.exercises[0]!.sets[0]!.actual = 0;
    expect(() => parseBackup(JSON.stringify(badWorkout))).toThrow();
  });
  it('拒絕重複資料 id、重複組 id 與多筆進行中訓練', () => {
    const backup = fixture();
    backup.plans.push(backup.plans[0]!);
    expect(() => parseBackup(JSON.stringify(backup))).toThrow();
    const sets = fixture();
    const rows = sets.workouts[0]!.exercises[0]!.sets;
    rows.push(rows[0]!);
    expect(() => parseBackup(JSON.stringify(sets))).toThrow();
    const active = fixture();
    active.workouts.push({ ...active.workouts[0]!, id: 'another-workout' });
    expect(() => parseBackup(JSON.stringify(active))).toThrow('Multiple active');
  });
  it('完成紀錄需有完成組及合理結束時間', () => {
    const backup = fixture();
    const workout = backup.workouts[0]!;
    workout.status = 'completed';
    workout.endedAt = workout.updatedAt;
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
    workout.endedAt = workout.startedAt - 1;
    expect(() => parseBackup(JSON.stringify(backup))).toThrow();
  });
});

describe('還原新增副本', () => {
  it('更新全部 id 並維持新廠區、課表、訓練日之間的關聯', () => {
    const backup = fixture();
    const copy = backupCopies(backup);
    expect(copy.plans[0]?.id).not.toBe(backup.plans[0]?.id);
    expect(copy.workouts[0]?.planId).toBe(copy.plans[0]?.id);
    expect(copy.workouts[0]?.dayId).toBe(copy.plans[0]?.days[0]?.id);
    expect(copy.workouts[0]?.gymId).toBe(copy.gyms[0]?.id);
    expect(copy.workouts[0]?.id).not.toBe(backup.workouts[0]?.id);
    expect(copy.workouts[0]?.exercises[0]?.sets[0]?.id).not.toBe(
      backup.workouts[0]?.exercises[0]?.sets[0]?.id,
    );
    copy.gyms[0]!.inventory.dumbbell!.count = 99;
    expect(backup.gyms[0]!.inventory.dumbbell!.count).toBe(2);
    expect(copy.workouts[0]?.exercises[0]?.sets[0]?.actual).toBe(10);
  });
  it('來源課表刪除的歷史仍可匯入，但不誤連結本機同 id 資料', () => {
    const backup = fixture();
    backup.plans = [];
    backup.gyms = [];
    const copy = backupCopies(backup);
    expect(copy.workouts[0]?.planId).not.toBe(backup.workouts[0]?.planId);
    expect(copy.workouts[0]?.gymId).not.toBe(backup.workouts[0]?.gymId);
    expect(copy.workouts[0]?.planName).toBe('課表');
  });
});
