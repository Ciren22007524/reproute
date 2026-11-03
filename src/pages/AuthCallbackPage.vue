<!-- 登入回呼頁面：顯示處理進度或可重新登入的錯誤訊息。 -->
<template>
  <q-page class="column flex-center q-pa-lg">
    <template v-if="failed">
      <q-icon name="error_outline" size="48px" color="negative" />
      <p class="q-mt-md">登入未完成，可能已取消、逾時或服務暫時無法使用。</p>
      <q-btn class="tap-target" color="primary" label="重新登入" @click="login" />
      <q-btn class="tap-target q-mt-sm" flat label="返回首頁" to="/" />
    </template>
    <template v-else>
      <q-spinner size="40px" color="primary" />
      <p class="q-mt-md" role="status">正在確認登入…</p>
    </template>
  </q-page>
</template>
<script setup lang="ts">
import { useAuthCallback } from '@/composables/useAuthCallback';
const { failed, login } = useAuthCallback();
</script>
