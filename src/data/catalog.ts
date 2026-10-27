/**
 * 器材主清單（內建資料，不需要同步）。
 * 原始資料在 data/equipment-catalog.json，要新增器材請改那個檔案。
 */
import raw from '../../data/equipment-catalog.json';
import type { Equipment, EquipmentCategory } from '@/types/domain';

/** 器材分類，順序就是清點頁顯示的順序 */
export const categories = raw.categories as EquipmentCategory[];

/** 所有器材 */
export const equipment = raw.equipment as Equipment[];

/** 用 id 快速查器材，例如 equipmentById.get('dumbbell') */
export const equipmentById = new Map(equipment.map((e) => [e.id, e]));
