/** 完整備份一致讀取與交易還原，任何一個資料表失敗即整份回滾。 */
import { db } from './index';
import { backupCopies, parseBackup, type AppBackup } from '@/utils/backup';

/** 有進行中訓練時不能再匯入另一堂，避免破壞唯一性。 */
export class BackupActiveWorkoutError extends Error {}

/** 不包含已刪除資料或認證憑證。 */
export function exportBackup(): Promise<AppBackup> {
  return db.transaction('r', db.gyms, db.plans, db.workouts, async () => ({
    format: 'reproute-backup',
    version: 1,
    exportedAt: Date.now(),
    gyms: await db.gyms.toArray(),
    plans: await db.plans.filter((item) => !item.deletedAt).toArray(),
    workouts: await db.workouts
      .filter((item) => !item.deletedAt && item.status !== 'discarded')
      .toArray(),
  }));
}

/** 重新驗證預覽資料，以新增副本還原；不清空、不覆蓋任何既有資料。 */
export async function importBackup(backup: AppBackup): Promise<void> {
  const copies = backupCopies(parseBackup(JSON.stringify(backup)));
  await db.transaction('rw', db.gyms, db.plans, db.workouts, async () => {
    if (
      copies.workouts.some((item) => item.status === 'active') &&
      (await db.workouts.where('status').equals('active').first())
    )
      throw new BackupActiveWorkoutError();
    await db.gyms.bulkAdd(copies.gyms);
    await db.plans.bulkAdd(copies.plans);
    await db.workouts.bulkAdd(copies.workouts);
  });
}
