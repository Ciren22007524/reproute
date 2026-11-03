<!-- 選擇單一廠區備份，顯示預覽與錯誤，確認後安全新增副本。 -->
<template>
  <q-expansion-item icon="upload_file" label="匯入廠區備份" class="q-mb-md">
    <q-card>
      <q-card-section>
        <div class="q-mb-sm">選擇先前匯出的 JSON。匯入會新增副本，不會覆蓋現有廠區。</div>
        <q-file
          :model-value="file"
          outlined
          label="選擇廠區 JSON（最多 1 MB）"
          accept=".json,application/json"
          clearable
          :disable="busy"
          @update:model-value="selectFile"
        />
        <q-banner v-if="error" role="alert" class="bg-red-1 text-negative q-mt-sm">
          {{ error }}
        </q-banner>
        <template v-if="preview">
          <div class="q-my-md">
            「{{ preview.name }}」：{{ ownedCount(preview.inventory) }} 種器材
          </div>
          <q-btn
            label="確認匯入副本"
            color="primary"
            class="tap-target"
            :loading="busy"
            @click="confirmImport"
          />
        </template>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { useGymImport } from '@/composables/useGymImport';
import { ownedCount } from '@/utils/inventory';

const emit = defineEmits<{
  /** 匯入成功，請父層重新載入清單。 */
  imported: [];
}>();
const { file, preview, busy, error, selectFile, confirmImport } = useGymImport(() =>
  emit('imported'),
);
</script>
