<!--
  頂部標題列。
  標題取自路由的 meta.title；路由設定 meta.back = true 時顯示返回鈕。
-->
<template>
  <q-header elevated>
    <q-toolbar>
      <q-btn
        v-if="route.meta.back"
        flat
        round
        dense
        icon="arrow_back"
        aria-label="返回"
        @click="router.back()"
      />
      <q-toolbar-title>{{ route.meta.title ?? 'RepRoute' }}</q-toolbar-title>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
</script>
