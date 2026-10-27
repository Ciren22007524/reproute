/**
 * 廠區資料的存取（repository）。
 *
 * 所有讀寫 gyms 資料表的地方都經過這裡，頁面不直接碰 Dexie。
 * 之後做 D1 同步時，要在這裡把刪除改成軟刪除（標記 deletedAt）。
 */
import { toRaw } from 'vue';
import { db } from './index';
import type { Gym } from '@/types/domain';

/** 所有廠區，最近修改的排最前面 */
export function listGyms(): Promise<Gym[]> {
  return db.gyms.orderBy('updatedAt').reverse().toArray();
}

/** 用 id 取得廠區；找不到時回傳 undefined */
export function getGym(id: string): Promise<Gym | undefined> {
  return db.gyms.get(id);
}

/** 建立一個空的廠區（還沒清點任何器材），回傳新廠區 */
export async function createGym(name: string): Promise<Gym> {
  const now = Date.now();
  const gym: Gym = {
    id: crypto.randomUUID(),
    name: name.trim(),
    inventory: {},
    createdAt: now,
    updatedAt: now,
  };
  await db.gyms.add(gym);
  return gym;
}

/**
 * 儲存整個廠區（新增或覆蓋）。
 * 傳進來的可能是 Vue 的 reactive proxy，IndexedDB 存不了 proxy，
 * 所以先用 toRaw 取出原始物件再深拷貝。
 */
export async function saveGym(gym: Gym): Promise<void> {
  await db.gyms.put(structuredClone(toRaw(gym)));
}

/** 刪除廠區與它的清點結果 */
export async function deleteGym(id: string): Promise<void> {
  await db.gyms.delete(id);
}
