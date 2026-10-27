/**
 * 把廠區資料匯出成 JSON 檔，當作手動備份。
 */
import { toRaw } from 'vue';
import { exportFile } from 'quasar';
import type { Gym } from '@/types/domain';

/**
 * 觸發瀏覽器下載 gym-<名稱>.json。
 * @returns 成功時 true；瀏覽器封鎖下載時 false
 */
export function exportGymJson(gym: Gym): boolean {
  const json = JSON.stringify(toRaw(gym), null, 2);
  return exportFile(`gym-${gym.name}.json`, json, { mimeType: 'application/json' }) === true;
}
