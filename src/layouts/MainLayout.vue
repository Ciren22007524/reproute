<!--
  主要版面：上方標題列 + 中間頁面內容 + 底部分頁列。
  所有一般頁面都是這個 layout 的子路由（見 router/routes.ts）。
-->
<template>
  <q-layout view="hHh lpR fFf">
    <AppHeader />

    <q-page-container>
      <router-view />
    </q-page-container>

    <AppBottomNav />
  </q-layout>
</template>

<script setup lang="ts">
import AppBottomNav from '@/components/layout/AppBottomNav.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
</script>
