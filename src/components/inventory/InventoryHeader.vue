<!--
  清點頁頂端：廠區名稱、清點進度，以及「匯出」按鈕。
-->
<template>
  <div class="row items-center q-mb-sm">
    <div class="col">
      <div class="text-h6">{{ name }}</div>
      <div class="text-caption text-grey-7">已勾選 {{ owned }} / {{ total }} 項</div>
    </div>
    <q-btn flat dense icon="download" label="匯出" no-caps @click="emit('export')" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** 廠區名稱 */
  name: string;
  /** 已清點的器材種類數 */
  owned: number;
  /** 器材主清單總數 */
  total: number;
}>();

const emit = defineEmits<{
  /** 按下「匯出」 */
  export: [];
}>();
</script>
