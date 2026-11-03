/** 廠區備份匯入：讀取與驗證後預覽，確認時新增副本，不覆寫既有資料。 */
import { ref, shallowRef } from 'vue';
import { useQuasar } from 'quasar';
import { importGymCopy } from '@/db/gyms';
import type { Gym } from '@/types/domain';
import { MAX_GYM_IMPORT_BYTES, parseGymJson } from '@/utils/importGym';

/** 建立匯入對話框的狀態與操作，成功後通知清單重新載入。 */
export function useGymImport(onImported: () => void) {
  const $q = useQuasar();
  const file = shallowRef<File | null>(null);
  const preview = shallowRef<Gym | null>(null);
  const busy = ref(false);
  const error = ref('');

  /** 換檔時清除先前預覽；非同步讀取只採用最後選擇的檔案。 */
  async function selectFile(value: File | null) {
    file.value = value;
    preview.value = null;
    error.value = '';
    if (!value) return;
    if (value.size > MAX_GYM_IMPORT_BYTES) {
      error.value = '檔案太大，請選擇 1 MB 以內的廠區備份。';
      return;
    }
    try {
      const gym = parseGymJson(await value.text());
      if (file.value === value) preview.value = gym;
    } catch {
      if (file.value === value)
        error.value = '無法讀取備份，請選擇由本 App 匯出的廠區 JSON，並確認器材清單相容。';
    }
  }

  /** 儲存成功才關閉預覽；失敗時保留檔案，讓使用者重試。 */
  async function confirmImport() {
    if (!preview.value || busy.value) return;
    busy.value = true;
    error.value = '';
    try {
      await importGymCopy(preview.value);
      preview.value = null;
      file.value = null;
      $q.notify({ type: 'positive', message: '已匯入廠區副本，原有資料未變更' });
      onImported();
    } catch {
      error.value = '匯入失敗，請確認瀏覽器可儲存資料後重試。';
    } finally {
      busy.value = false;
    }
  }

  return { file, preview, busy, error, selectFile, confirmImport };
}
