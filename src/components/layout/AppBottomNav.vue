<!--
  底部分頁列，像手機 App 一樣切換四個主要頁面。
  顏色跟著 Quasar 的深色模式切換。
-->
<template>
  <q-footer bordered :class="$q.dark.isActive ? 'bg-dark text-grey-4' : 'bg-white text-grey-8'">
    <q-tabs
      no-caps
      dense
      active-color="primary"
      indicator-color="transparent"
      class="q-py-xs"
      align="justify"
    >
      <!-- 首頁要 exact，否則在任何頁面都會被視為「目前所在」 -->
      <q-route-tab
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :icon="tab.icon"
        :label="tab.label"
        :exact="tab.to === '/'"
      />
    </q-tabs>
  </q-footer>
</template>

<script setup lang="ts">
/** 分頁項目；新增主要頁面時在這裡加一筆，並到 router/routes.ts 加路由 */
const tabs = [
  { to: '/', icon: 'fitness_center', label: '今日訓練' },
  { to: '/plans', icon: 'event_note', label: '課表' },
  { to: '/gyms', icon: 'store', label: '廠區' },
  { to: '/history', icon: 'insights', label: '紀錄' },
];
</script>
