<!-- 紀錄頁（/history）。目前只顯示預告，v0.3 會實作：訓練紀錄、估算 1RM 與建議重量 -->
<template>
  <q-page padding>
    <EmptyState
      icon="insights"
      title="紀錄"
      description="v0.3 會在這裡顯示訓練紀錄、估算 1RM 與建議重量。"
    />
  </q-page>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
</script>
