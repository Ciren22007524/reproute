/**
 * 廠區器材清點的純函式。
 *
 * 這裡的函式都不碰資料庫或 Vue，只吃資料、回傳新資料，
 * 方便單獨閱讀與之後寫單元測試。呼叫端負責把結果存回去。
 */
import type { Equipment, EquipmentCategory, GymEquipment, GymInventory } from '@/types/domain';

/** 某項器材在這個廠區的數量；沒清點過就是 0 */
export function countOf(inventory: GymInventory, equipmentId: string): number {
  return inventory[equipmentId]?.count ?? 0;
}

/** 這個廠區「有」的器材種類數（數量 > 0 的項目數，不是總台數） */
export function ownedCount(inventory: GymInventory): number {
  return Object.values(inventory).filter((item) => item.count > 0).length;
}

/**
 * 設定某項器材的數量，回傳新的 inventory。
 * 數量 ≤ 0 時整筆移除，避免存一堆 count: 0 的資料。
 */
export function withCount(
  inventory: GymInventory,
  equipmentId: string,
  count: number,
): GymInventory {
  const next = { ...inventory };
  if (count <= 0) {
    delete next[equipmentId];
  } else {
    next[equipmentId] = { ...inventory[equipmentId], count };
  }
  return next;
}

/**
 * 把輸入框的值轉成公斤數。
 * 空白、非數字、0 或負數都視為「沒填」，回傳 undefined。
 */
export function parseMaxWeightKg(value: string | number | null): number | undefined {
  if (value === null || value === '') return undefined;
  const kg = Number(value);
  return Number.isFinite(kg) && kg > 0 ? kg : undefined;
}

/**
 * 設定某項器材的最重重量，回傳新的 inventory。
 * 只有已清點（數量 > 0）的器材才能設定；kg 為 undefined 時清除。
 */
export function withMaxWeight(
  inventory: GymInventory,
  equipmentId: string,
  kg: number | undefined,
): GymInventory {
  const current = inventory[equipmentId];
  if (!current) return inventory;

  const updated: GymEquipment = { ...current };
  if (kg === undefined) {
    delete updated.maxWeightKg;
  } else {
    updated.maxWeightKg = kg;
  }
  return { ...inventory, [equipmentId]: updated };
}

/** 器材名稱（中文或英文）是否包含關鍵字，不分大小寫；空關鍵字一律符合 */
export function matchesKeyword(item: Equipment, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return true;
  return item.name.toLowerCase().includes(k) || item.nameEn.toLowerCase().includes(k);
}

/** 清點頁上的一個分類區塊 */
export interface EquipmentGroup {
  category: EquipmentCategory;
  /** 經過篩選後要顯示的器材 */
  items: Equipment[];
  /** 這個分類的器材總數（不受篩選影響） */
  total: number;
  /** 這個分類已清點的種類數（不受篩選影響） */
  owned: number;
}

export interface GroupOptions {
  keyword: string;
  onlyOwned: boolean;
}

/**
 * 依分類分組並套用篩選。
 * 篩選後沒有任何器材的分類會被拿掉，畫面上就不會出現空的區塊。
 */
export function groupEquipment(
  categories: EquipmentCategory[],
  equipment: Equipment[],
  inventory: GymInventory,
  { keyword, onlyOwned }: GroupOptions,
): EquipmentGroup[] {
  const isOwned = (e: Equipment) => countOf(inventory, e.id) > 0;

  return categories
    .map((category) => {
      const all = equipment.filter((e) => e.category === category.id);
      return {
        category,
        items: all.filter((e) => (!onlyOwned || isOwned(e)) && matchesKeyword(e, keyword)),
        total: all.length,
        owned: all.filter(isOwned).length,
      };
    })
    .filter((group) => group.items.length > 0);
}
