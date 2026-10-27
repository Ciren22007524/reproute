<!-- 今日訓練頁（/）。目前只顯示預告，v0.2 會實作：今天的動作順序、器材被占用時換動作或重排 -->
<template>
  <q-page padding>
    <EmptyState
      icon="fitness_center"
      title="今日訓練"
      description="v0.2 會在這裡顯示今天的動作順序，器材被占用時一鍵換動作或重排。"
    />
  </q-page>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
</script>
