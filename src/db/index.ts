/**
 * IndexedDB 資料庫定義（使用 Dexie）。
 *
 * 個人資料只存在這台裝置的瀏覽器裡；之後會再同步到 Cloudflare D1 當備份。
 * 頁面和組件不要直接 import 這個檔案，請透過同資料夾的 repository（例如 gyms.ts）存取，
 * 之後加同步邏輯時只需要改 repository。
 */
import Dexie, { type EntityTable } from 'dexie';
import type { Gym } from '@/types/domain';

export const db = new Dexie('reproute') as Dexie & {
  gyms: EntityTable<Gym, 'id'>;
};

// 資料表與索引。之後改結構時要新增 db.version(2)，不能直接改這裡。
db.version(1).stores({
  gyms: 'id, name, updatedAt',
});
