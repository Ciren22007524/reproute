<!--
  標題列右上角的帳號按鈕：顯示登入的 email 首字，點開看完整 email 與狀態。
  資料來自 useCurrentUser（/api/me）。
-->
<template>
  <q-btn class="tap-target" flat round dense :aria-label="buttonLabel">
    <q-avatar v-if="user" size="32px" color="white" text-color="primary">
      {{ initial }}
    </q-avatar>
    <q-icon v-else name="account_circle" />

    <q-menu v-model="menuOpen" anchor="bottom right" self="top right">
      <q-list style="min-width: 220px">
        <q-item>
          <q-item-section avatar><q-icon name="account_circle" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ user?.email || '未登入' }}</q-item-label>
            <q-item-label caption>{{ statusText }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item
          v-if="status !== 'signed-in' && status !== 'loading'"
          class="tap-target"
          clickable
          @click="
            menuOpen = false;
            login();
          "
        >
          <q-item-section avatar><q-icon name="login" /></q-item-section>
          <q-item-section>登入</q-item-section>
        </q-item>
        <q-item
          v-if="status === 'signed-in' || status === 'logout-failed'"
          class="tap-target"
          clickable
          @click="
            menuOpen = false;
            signOut();
          "
        >
          <q-item-section avatar><q-icon name="logout" /></q-item-section>
          <q-item-section>{{ status === 'logout-failed' ? '重試登出' : '登出' }}</q-item-section>
        </q-item>
        <q-item
          v-if="status !== 'signed-out' && status !== 'logout-failed'"
          class="tap-target"
          clickable
          @click="
            menuOpen = false;
            refresh();
          "
        >
          <q-item-section avatar><q-icon name="refresh" /></q-item-section>
          <q-item-section>重新確認登入狀態</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useCurrentUser } from '@/composables/useCurrentUser';

const menuOpen = shallowRef(false);

const { user, status, refresh, login, signOut } = useCurrentUser();

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
    case 'signed-out':
      return '已登出';
    case 'logout-failed':
      return '本機已登出，遠端登出失敗，請重試';
    case 'expired':
      return '登入已過期';
    default:
      return '無法取得登入資訊，請確認服務與網址後重試';
  }
});

const buttonLabel = computed(() => (user.value ? `帳號：${user.value.email}` : '帳號'));
</script>
