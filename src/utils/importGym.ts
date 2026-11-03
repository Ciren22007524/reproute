/** 驗證廠區 JSON 備份，僅回傳已檢查的欄位，避免匯入無法顯示或不合法的資料。 */
import { equipmentById } from '../data/catalog';
import type { Gym, GymEquipment } from '../types/domain';

/** 單一廠區備份的大小上限，避免意外選到大型檔案。 */
export const MAX_GYM_IMPORT_BYTES = 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function timestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** 解析既有匯出格式；驗證失敗時不回傳任何部分資料。 */
export function parseGymJson(text: string): Gym {
  const raw: unknown = JSON.parse(text);
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'string' ||
    !raw.id.trim() ||
    typeof raw.name !== 'string' ||
    !raw.name.trim() ||
    !timestamp(raw.createdAt) ||
    !timestamp(raw.updatedAt) ||
    raw.updatedAt < raw.createdAt ||
    !isRecord(raw.inventory)
  ) {
    throw new Error('Invalid gym backup');
  }

  const entries: [string, GymEquipment][] = [];
  for (const [id, value] of Object.entries(raw.inventory)) {
    const equipment = equipmentById.get(id);
    if (
      !equipment ||
      !isRecord(value) ||
      typeof value.count !== 'number' ||
      !Number.isSafeInteger(value.count) ||
      value.count < 0 ||
      (value.maxWeightKg !== undefined &&
        (!equipment.hasWeightRange ||
          typeof value.maxWeightKg !== 'number' ||
          !Number.isFinite(value.maxWeightKg) ||
          value.maxWeightKg <= 0)) ||
      (value.note !== undefined && typeof value.note !== 'string')
    ) {
      throw new Error('Invalid gym inventory');
    }
    const item: GymEquipment = { count: value.count };
    if (typeof value.maxWeightKg === 'number') item.maxWeightKg = value.maxWeightKg;
    if (typeof value.note === 'string') item.note = value.note;
    entries.push([id, item]);
  }

  return {
    id: raw.id,
    name: raw.name.trim(),
    inventory: Object.fromEntries(entries),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
