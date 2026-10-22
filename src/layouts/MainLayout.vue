<template>
  <q-layout view="hHh lpR fFf">
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

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer
      bordered
      class="bg-white text-grey-8"
      :class="{ 'bg-dark text-grey-4': $q.dark.isActive }"
    >
      <q-tabs
        no-caps
        dense
        active-color="primary"
        indicator-color="transparent"
        class="q-py-xs"
        align="justify"
      >
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
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tabs = [
  { to: '/', icon: 'fitness_center', label: '今日訓練' },
  { to: '/plans', icon: 'event_note', label: '課表' },
  { to: '/gyms', icon: 'store', label: '廠區' },
  { to: '/history', icon: 'insights', label: '紀錄' },
];
</script>
