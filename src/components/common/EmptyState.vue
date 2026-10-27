<!--
  置中的提示畫面：大圖示 + 標題 + 說明。
  用在「還沒有資料」或「功能還沒做」的頁面。
-->
<template>
  <div class="column items-center text-center text-grey-7 q-pa-xl">
    <q-icon :name="icon" size="64px" class="q-mb-md" />
    <div class="text-h6">{{ title }}</div>
    <div class="q-mt-sm">{{ description }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Material Icons 的名稱，例如 store */
  icon: string;
  title: string;
  description: string;
}>();
</script>
