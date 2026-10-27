<!--
  標題列右上角的帳號按鈕：顯示登入的 email 首字，點開看完整 email 與狀態。
  資料來自 useCurrentUser（/api/me）。
-->
<template>
  <q-btn flat round dense :aria-label="buttonLabel">
    <q-avatar v-if="user" size="32px" color="white" text-color="primary">
      {{ initial }}
    </q-avatar>
    <q-icon v-else name="account_circle" />

    <q-menu anchor="bottom right" self="top right">
      <q-list style="min-width: 220px">
        <q-item>
          <q-item-section avatar><q-icon name="account_circle" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ user?.email || '未登入' }}</q-item-label>
            <q-item-label caption>{{ statusText }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <!-- 登入過期時，重新整理整頁會讓 Cloudflare Access 帶去登入頁 -->
        <q-item v-if="status === 'expired'" v-close-popup clickable @click="reloadPage">
          <q-item-section avatar><q-icon name="login" /></q-item-section>
          <q-item-section>重新登入</q-item-section>
        </q-item>
        <q-item v-else v-close-popup clickable @click="refresh">
          <q-item-section avatar><q-icon name="refresh" /></q-item-section>
          <q-item-section>重新確認登入狀態</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCurrentUser } from '@/composables/useCurrentUser';

const { user, status, refresh } = useCurrentUser();

/** email 的第一個字母，顯示在頭像裡 */
const initial = computed(() => user.value?.email.charAt(0).toUpperCase() || '?');

const statusText = computed(() => {
  switch (status.value) {
    case 'loading':
      return '確認中…';
    case 'signed-in':
      return '已登入';
    case 'offline':
      return user.value ? '離線中（顯示上次登入的帳號）' : '離線中';
    case 'expired':
      return '登入已過期';
    default:
      return '無法取得登入資訊';
  }
});

const buttonLabel = computed(() => (user.value ? `帳號：${user.value.email}` : '帳號'));

function reloadPage() {
  window.location.reload();
}
</script>
