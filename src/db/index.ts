import Dexie, { type EntityTable } from 'dexie';
import type { Gym } from '@/types/domain';

// 個人資料只存在這台裝置的 IndexedDB，不會上傳
export const db = new Dexie('reproute') as Dexie & {
  gyms: EntityTable<Gym, 'id'>;
};

db.version(1).stores({
  gyms: 'id, name, updatedAt',
});
