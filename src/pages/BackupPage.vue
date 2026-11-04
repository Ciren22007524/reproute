<!-- 完整本機備份頁，檔案可透過作業系統保存到 iCloud Drive 等位置。 -->
<template>
  <q-page padding>
    <q-banner v-if="error" role="alert" class="q-mb-md bg-red-1 text-negative">{{
      error
    }}</q-banner>
    <div class="text-h6 q-mb-sm">完整資料備份</div>
    <div class="q-mb-md">
      包含廠區、課表、已完成與已儲存的進行中訓練，不含登入或雲端憑證。先儲存編輯中的資料，再下載備份。
    </div>
    <q-btn
      label="下載完整備份"
      icon="download"
      color="primary"
      class="tap-target q-mb-lg"
      :loading="busy"
      @click="download"
    />
    <div class="text-h6 q-mb-sm">還原完整備份</div>
    <div class="q-mb-md">
      還原會新增副本，不覆蓋或清除原有資料。檔案最多 10
      MB；含進行中訓練時，本機必須先結束或放棄目前訓練。
    </div>
    <q-file
      :model-value="file"
      outlined
      clearable
      label="選擇完整備份 JSON"
      accept=".json,application/json"
      :disable="busy"
      @update:model-value="selectFile"
    />
    <q-card v-if="preview" flat bordered class="q-my-md">
      <q-card-section>
        <div>備份時間：{{ new Date(preview.exportedAt).toLocaleString('zh-TW') }}</div>
        <div>
          {{ preview.gyms.length }} 個廠區、{{ preview.plans.length }} 份課表、{{
            preview.workouts.length
          }}
          次訓練
        </div>
        <div v-if="preview.workouts.some((item) => item.status === 'active')" class="q-mt-sm">
          包含 1 堂進行中訓練，還原後可在今日訓練接續。
        </div>
        <q-btn
          label="確認新增副本並還原"
          color="primary"
          class="tap-target q-mt-md"
          :loading="busy"
          @click="restore"
        />
      </q-card-section>
    </q-card>
    <div class="q-mt-lg">
      可將檔案存到系統提供的 iCloud Drive
      或其他位置，再從那裡選檔還原。這是手動備份，不是背景同步；沒有使用 Apple 登入或取得 iCloud API
      權限。
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { useBackup } from '@/composables/useBackup';
const { file, preview, busy, error, download, selectFile, restore } = useBackup();
</script>
