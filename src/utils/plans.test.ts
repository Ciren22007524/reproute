/** 課表模式、完整性與排序測試，確保草稿不會改到其他訓練日。 */
import { describe, expect, it } from 'vitest';
import { moveItem, newPlan, newPlanDay, newPlanExercise, planError, updatePlanDay } from './plans';

function validPlan() {
  const plan = newPlan('全身', 'single');
  plan.days = [{ ...newPlanDay('本堂訓練'), exercises: [newPlanExercise('push-up')] }];
  return plan;
}

describe('課表結構與驗證', () => {
  it('兩種模式共用訓練日，但保留模式與獨立 id', () => {
    const single = newPlan('單堂', 'single');
    const multi = newPlan('多日', 'multi');
    expect(single.mode).toBe('single');
    expect(multi.mode).toBe('multi');
    expect(single.days).toHaveLength(1);
    expect(multi.days).toHaveLength(1);
    expect(single.id).not.toBe(multi.id);
    expect(single.days[0]?.id).not.toBe(multi.days[0]?.id);
  });
  it('不允許空名稱與沒有動作的草稿被儲存', () => {
    expect(planError(newPlan('', 'single'))).toBeDefined();
    expect(planError(newPlan('空白', 'multi'))).toBeDefined();
    expect(planError(validPlan())).toBeUndefined();
  });
  it('單堂只能有一個訓練單元，多日接受多個非空訓練日', () => {
    const plan = validPlan();
    plan.days.push({ ...newPlanDay('第二天'), exercises: [newPlanExercise('goblet-squat')] });
    expect(planError(plan)).toBeDefined();
    expect(planError({ ...plan, mode: 'multi' })).toBeUndefined();
    expect(planError({ ...plan, mode: 'multi', days: [] })).toBeDefined();
  });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    '拒絕不合法組數或目標：%s',
    (value) => {
      const plan = validPlan();
      const day = plan.days[0]!;
      const item = day.exercises[0]!;
      expect(
        planError({ ...plan, days: [{ ...day, exercises: [{ ...item, sets: value }] }] }),
      ).toBeDefined();
      expect(
        planError({ ...plan, days: [{ ...day, exercises: [{ ...item, target: value }] }] }),
      ).toBeDefined();
    },
  );
  it('接受秒數目標，拒絕未知動作與重複列 id', () => {
    const plan = validPlan();
    const day = plan.days[0]!;
    const item = day.exercises[0]!;
    expect(
      planError({
        ...plan,
        days: [{ ...day, exercises: [{ ...item, target: 30, targetUnit: 'seconds' }] }],
      }),
    ).toBeUndefined();
    expect(
      planError({ ...plan, days: [{ ...day, exercises: [{ ...item, exerciseId: 'missing' }] }] }),
    ).toBeDefined();
    expect(planError({ ...plan, days: [{ ...day, exercises: [item, item] }] })).toBeDefined();
    expect(() => newPlanExercise('missing')).toThrow();
  });
  it('同動作可重複加入，但每列仍有獨立 id', () => {
    const first = newPlanExercise('push-up');
    const second = newPlanExercise('push-up');
    expect(first.id).not.toBe(second.id);
    const plan = validPlan();
    expect(
      planError({ ...plan, days: [{ ...newPlanDay('重複動作'), exercises: [first, second] }] }),
    ).toBeUndefined();
  });
});

describe('課表不可變編輯', () => {
  it('移動中間項目與第一、最後項目，保留所有項目及原陣列', () => {
    const original = ['a', 'b', 'c'];
    expect(moveItem(original, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(original, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItem(original, 1, 0)).toEqual(['b', 'a', 'c']);
    expect(original).toEqual(['a', 'b', 'c']);
  });
  it('越界、找不到與非整數排序位置不遺失項目', () => {
    const items = ['a', 'b'];
    for (const [from, to] of [
      [-1, 0],
      [0, 2],
      [NaN, 0],
      [0.5, 0],
    ])
      expect(moveItem(items, from!, to!)).toEqual(items);
  });
  it('僅更新指定日，不修改原課表或其他訓練日', () => {
    const plan = newPlan('推拉', 'multi');
    const first = plan.days[0]!;
    const second = newPlanDay('拉');
    plan.days.push(second);
    const result = updatePlanDay(plan, first.id, (day) => ({
      ...day,
      exercises: [newPlanExercise('push-up')],
    }));
    expect(plan.days[0]?.exercises).toHaveLength(0);
    expect(result.days[0]?.exercises).toHaveLength(1);
    expect(result.days[1]).toBe(second);
  });
});
