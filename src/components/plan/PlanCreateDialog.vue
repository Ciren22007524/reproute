<!-- 建立課表時選擇單堂或多日，不先寫入空白資料。 -->
<template>
  <q-dialog v-model="open">
    <q-card style="width: 360px; max-width: 95vw">
      <q-card-section class="text-h6">選擇課表模式</q-card-section>
      <q-card-section class="q-gutter-md">
        <q-btn
          label="單堂課表"
          class="full-width tap-target"
          color="primary"
          @click="emit('create', 'single')"
        />
        <div>每份是一堂訓練，當天自行選擇。</div>
        <q-btn
          label="多日課表"
          class="full-width tap-target"
          color="primary"
          @click="emit('create', 'multi')"
        />
        <div>一份包含多個訓練日，例如推／拉／腿；不綁定星期。</div>
      </q-card-section>
      <q-card-actions align="right"
        ><q-btn v-close-popup flat label="取消" class="tap-target"
      /></q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import type { PlanMode } from '@/types/plan';
/** 選擇模式對話框是否開啟。 */
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  /** 進入指定模式。 */
  create: [mode: PlanMode];
}>();
</script>
