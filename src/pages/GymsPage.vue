<!--
  廠區清單頁（/gyms）。
  狀態與對話框在 useGymList；每一列是 GymListItem。
-->
<template>
  <q-page padding>
    <q-list v-if="gyms.length" bordered separator class="rounded-borders">
      <GymListItem v-for="gym in gyms" :key="gym.id" :gym="gym" @delete="confirmDelete" />
    </q-list>

    <EmptyState
      v-else
      icon="store"
      title="還沒有廠區"
      description="新增你常去的分館，到現場逐項清點有哪些器材。之後排課與推薦替代動作都會依照廠區的器材。"
    />

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" aria-label="新增廠區" @click="addGym" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import GymListItem from '@/components/gym/GymListItem.vue';
import { useGymList } from '@/composables/useGymList';

const { gyms, addGym, confirmDelete } = useGymList();
</script>
