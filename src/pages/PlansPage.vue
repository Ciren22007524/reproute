<!-- 課表頁（/plans）。目前只顯示預告，v0.1 會實作：手動建立課表 -->
<template>
  <q-page padding>
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
