<template>
  <q-page padding>
    <q-list v-if="gyms.length" bordered separator class="rounded-borders">
      <q-item v-for="gym in gyms" :key="gym.id" clickable :to="`/gyms/${gym.id}`">
        <q-item-section avatar>
          <q-icon name="store" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ gym.name }}</q-item-label>
          <q-item-label caption>已清點 {{ ownedCount(gym) }} 項器材</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            round
            dense
            icon="delete_outline"
            aria-label="刪除廠區"
            @click.prevent.stop="confirmDelete(gym)"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <ComingSoon
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
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import ComingSoon from '@/components/ComingSoon.vue';
import { db } from '@/db';
import type { Gym } from '@/types/domain';

const $q = useQuasar();
const router = useRouter();
const gyms = ref<Gym[]>([]);

async function load() {
  gyms.value = await db.gyms.orderBy('updatedAt').reverse().toArray();
}

function ownedCount(gym: Gym) {
  return Object.values(gym.inventory).filter((item) => item.count > 0).length;
}

function addGym() {
  $q.dialog({
    title: '新增廠區',
    message: '例如：健身工廠 XX 廠',
    prompt: { model: '', type: 'text', isValid: (v: string) => v.trim().length > 0 },
    cancel: true,
  }).onOk(async (name: string) => {
    const now = Date.now();
    const id = crypto.randomUUID();
    await db.gyms.add({ id, name: name.trim(), inventory: {}, createdAt: now, updatedAt: now });
    await router.push(`/gyms/${id}`);
  });
}

function confirmDelete(gym: Gym) {
  $q.dialog({
    title: '刪除廠區',
    message: `確定要刪除「${gym.name}」以及它的清點結果嗎？`,
    cancel: true,
    ok: { label: '刪除', color: 'negative', flat: true },
  }).onOk(async () => {
    await db.gyms.delete(gym.id);
    await load();
  });
}

onMounted(load);
</script>
