/** 備份解析的資料完整性與拒絕不合法輸入測試。 */
import { describe, expect, it } from 'vitest';
import { parseGymJson } from './importGym';

const backup = {
  id: 'backup-id',
  name: '測試廠區',
  inventory: { dumbbell: { count: 2, maxWeightKg: 40, note: '一樓' } },
  createdAt: 1000,
  updatedAt: 2000,
};

describe('parseGymJson', () => {
  it('保留既有匯出格式的器材、重量與備註', () => {
    expect(parseGymJson(JSON.stringify(backup))).toEqual(backup);
  });

  it('接受空清點資料及數量為零的項目', () => {
    expect(parseGymJson(JSON.stringify({ ...backup, inventory: {} })).inventory).toEqual({});
    const inventory = { dumbbell: { count: 0 } };
    expect(parseGymJson(JSON.stringify({ ...backup, inventory })).inventory).toEqual(inventory);
  });

  it.each([
    null,
    [],
    {},
    { ...backup, name: ' ' },
    { ...backup, id: 1 },
    { ...backup, inventory: [] },
    { ...backup, createdAt: -1 },
    { ...backup, updatedAt: 999 },
    { ...backup, updatedAt: '2000' },
  ])('拒絕不完整或型別不符的廠區資料：%j', (value) => {
    expect(() => parseGymJson(JSON.stringify(value))).toThrow();
  });

  it.each([
    { unknown: { count: 1 } },
    { dumbbell: null },
    { dumbbell: { count: '2' } },
    { dumbbell: { count: -1 } },
    { dumbbell: { count: 1.5 } },
    { dumbbell: { count: 2, maxWeightKg: 0 } },
    { dumbbell: { count: 2, maxWeightKg: '40' } },
    { dumbbell: { count: 2, note: {} } },
  ])('拒絕不合法器材，不部分匯入：%j', (inventory) => {
    expect(() => parseGymJson(JSON.stringify({ ...backup, inventory }))).toThrow();
  });

  it('拒絕無限大數值與特殊物件鍵，避免污染清點資料', () => {
    expect(() => parseGymJson(JSON.stringify(backup).replace('40', '1e400'))).toThrow();
    const inventory = JSON.parse('{"__proto__":{"count":1}}') as unknown;
    expect(() => parseGymJson(JSON.stringify({ ...backup, inventory }))).toThrow();
  });

  it('不保留備份中未定義的欄位', () => {
    expect(parseGymJson(JSON.stringify({ ...backup, extra: 'ignored' }))).toEqual(backup);
  });

  it('拒絕損壞的 JSON', () => {
    expect(() => parseGymJson('{')).toThrow();
  });
});
