<!-- 課表頁（/plans）。目前只顯示預告，v0.1 會實作：手動建立課表 -->
<template>
  <q-page padding>
    <q-btn
      to="/plans/exercises"
      label="瀏覽動作資料庫"
      icon="fitness_center"
      color="primary"
      class="tap-target q-mb-md"
    />
    <EmptyState
      icon="event_note"
      title="課表"
      description="v0.1 會在這裡建立課表；先到「廠區」完成器材清點。"
    />
  </q-page>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
</script>
