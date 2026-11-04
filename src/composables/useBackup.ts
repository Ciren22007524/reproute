/** 完整備份檔案操作與預覽，不存取雲端或任何登入憑證。 */
import { ref, shallowRef } from 'vue';
import { exportFile, useQuasar } from 'quasar';
import { BackupActiveWorkoutError, exportBackup, importBackup } from '@/db/backup';
import { MAX_BACKUP_BYTES, parseBackup, type AppBackup } from '@/utils/backup';

/** 提供下載、選檔預覽及新增副本還原。 */
export function useBackup() {
  const $q = useQuasar();
  const file = shallowRef<File | null>(null);
  const preview = shallowRef<AppBackup | null>(null);
  const busy = ref(false);
  const error = ref('');
  async function download() {
    if (busy.value) return;
    busy.value = true;
    error.value = '';
    try {
      const backup = parseBackup(JSON.stringify(await exportBackup()));
      const filename = `reproute-backup-${new Date().toLocaleDateString('sv-SE')}.json`;
      const json = JSON.stringify(backup, null, 2);
      if (new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES)
        throw new Error('Backup too large');
      if (exportFile(filename, json, { mimeType: 'application/json' }) !== true)
        throw new Error('Download blocked');
    } catch {
      error.value = '無法匯出，請確認瀏覽器允許下載、資料可讀取且備份不超過 10 MB。';
    } finally {
      busy.value = false;
    }
  }
  async function selectFile(value: File | null) {
    if (busy.value) return;
    file.value = value;
    preview.value = null;
    error.value = '';
    if (!value) return;
    if (value.size > MAX_BACKUP_BYTES) {
      error.value = '檔案太大，請選擇 10 MB 以內的完整備份。';
      return;
    }
    try {
      const backup = parseBackup(await value.text());
      if (file.value === value) preview.value = backup;
    } catch {
      if (file.value === value)
        error.value =
          '無法讀取備份，請選擇本 App 匯出的完整備份，並確認版本與內容相容。單一廠區 JSON 請到廠區清單匯入。';
    }
  }
  async function restore() {
    if (!preview.value || busy.value) return;
    busy.value = true;
    error.value = '';
    try {
      await importBackup(preview.value);
      preview.value = null;
      file.value = null;
      $q.notify({ type: 'positive', message: '完整備份已還原為新增副本，原有資料未變更' });
    } catch (cause) {
      error.value =
        cause instanceof BackupActiveWorkoutError
          ? '目前已有進行中訓練，請先結束或放棄，再匯入含進行中訓練的備份。'
          : '還原失敗，原有資料未變更。請確認儲存空間後重試。';
    } finally {
      busy.value = false;
    }
  }
  return { file, preview, busy, error, download, selectFile, restore };
}
