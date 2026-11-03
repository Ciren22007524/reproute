/** 動作資料完整性、器材布林規則與替代動作篩選的測試。 */
import { describe, expect, it } from 'vitest';
import { exercises, exerciseById } from '../data/exercises';
import { equipmentById } from '../data/catalog';
import { availableAlternatives, canPerform, filterExercises } from './exercises';

function exercise(id: string) {
  const item = exerciseById.get(id);
  if (!item) throw new Error('Missing test fixture');
  return item;
}

describe('內建動作資料', () => {
  it('所有動作 id 唯一，器材與替代動作引用均存在', () => {
    expect(exercises.length).toBeGreaterThan(0);
    expect(exerciseById.size).toBe(exercises.length);
    for (const item of exercises) {
      expect(item.name.trim()).not.toBe('');
      expect(item.nameEn.trim()).not.toBe('');
      expect(item.pattern.trim()).not.toBe('');
      expect(item.primaryMuscles.length).toBeGreaterThan(0);
      expect(item.equipment.length).toBeGreaterThan(0);
      for (const id of item.equipment.flat()) expect(equipmentById.has(id)).toBe(true);
      for (const id of item.alternatives) {
        expect(id).not.toBe(item.id);
        expect(exercise(id).pattern).toBe(item.pattern);
        expect(exercise(id).primaryMuscles.some((m) => item.primaryMuscles.includes(m))).toBe(true);
      }
    }
  });
});

describe('canPerform', () => {
  it('徒手動作不需要清點器材', () => {
    expect(canPerform(exercise('push-up'), {})).toBe(true);
  });
  it('同一組器材必須全部齊全', () => {
    expect(canPerform(exercise('dumbbell-bench-press'), { dumbbell: { count: 2 } })).toBe(false);
    expect(
      canPerform(exercise('dumbbell-bench-press'), {
        dumbbell: { count: 2 },
        'flat-bench': { count: 1 },
      }),
    ).toBe(true);
  });
  it('替代器材組合任一組齊全即可', () => {
    expect(
      canPerform(exercise('dumbbell-bench-press'), {
        dumbbell: { count: 2 },
        'adjustable-bench': { count: 1 },
      }),
    ).toBe(true);
  });
  it('器材數量為零不算可用', () => {
    expect(canPerform(exercise('goblet-squat'), { dumbbell: { count: 0 } })).toBe(false);
  });
  it('槓鈴動作必須有槓片，深蹲還需要架', () => {
    const inventory = { 'olympic-barbell': { count: 1 }, 'power-rack': { count: 1 } };
    expect(canPerform(exercise('barbell-squat'), inventory)).toBe(false);
    expect(
      canPerform(exercise('barbell-squat'), { ...inventory, 'weight-plate': { count: 2 } }),
    ).toBe(true);
  });
});

describe('動作搜尋與替代動作', () => {
  it('英文不分大小寫，肌群也能搜尋', () => {
    expect(filterExercises(exercises, ' PuSh-Up ', null).map((e) => e.id)).toEqual(['push-up']);
    expect(filterExercises(exercises, '肱三頭肌', '水平推').length).toBe(4);
  });
  it('組合動作模式與廠區篩選，空器材廠區只回傳徒手動作', () => {
    expect(filterExercises(exercises, '', '水平推', {}).map((e) => e.id)).toEqual(['push-up']);
    expect(filterExercises(exercises, '不存在', null)).toEqual([]);
  });
  it('依模式、主要肌群與廠區器材顯示替代動作', () => {
    expect(
      availableAlternatives(exercise('barbell-bench-press'), exercises, {}).map((e) => e.id),
    ).toEqual(['push-up']);
    expect(availableAlternatives(exercise('plank'), exercises, {})).toEqual([]);
  });
  it('即使資料誤填替代 id，也不回傳自己或不同模式的動作', () => {
    const item = { ...exercise('push-up'), alternatives: ['push-up', 'plank'] };
    expect(availableAlternatives(item, exercises)).toEqual([]);
  });
});
