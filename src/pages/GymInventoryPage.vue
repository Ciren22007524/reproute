<template>
  <q-page v-if="gym" padding>
    <div class="row items-center q-mb-sm">
      <div class="col">
        <div class="text-h6">{{ gym.name }}</div>
        <div class="text-caption text-grey-7">已勾選 {{ ownedTotal }} / {{ equipment.length }} 項</div>
      </div>
      <q-btn flat dense icon="download" label="匯出" no-caps @click="exportJson" />
    </div>

    <q-input v-model="search" dense outlined clearable placeholder="搜尋器材" class="q-mb-sm">
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>
    <q-toggle v-model="onlyOwned" label="只顯示已勾選" class="q-mb-sm" />

    <q-list bordered class="rounded-borders">
      <q-expansion-item
        v-for="group in groups"
        :key="group.category.id"
        :label="group.category.name"
        :caption="`${group.owned} / ${group.total}`"
        :default-opened="!!search"
        header-class="text-weight-medium"
      >
        <q-item v-for="item in group.items" :key="item.id" class="q-py-sm">
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label caption>{{ item.nameEn }}</q-item-label>
            <q-input
              v-if="item.hasWeightRange && countOf(item.id) > 0"
              :model-value="gym.inventory[item.id]?.maxWeightKg ?? null"
              type="number"
              dense
              outlined
              suffix="kg"
              label="最重"
              class="q-mt-xs"
              style="max-width: 140px"
              @update:model-value="(v) => setMaxWeight(item.id, v)"
            />
          </q-item-section>
          <q-item-section side>
            <div class="row items-center no-wrap">
              <q-btn
                round
                flat
                icon="remove"
                class="tap-target"
                :disable="countOf(item.id) === 0"
                :aria-label="`減少${item.name}`"
                @click="setCount(item.id, countOf(item.id) - 1)"
              />
              <div class="text-subtitle1 text-center" style="min-width: 24px">{{ countOf(item.id) }}</div>
              <q-btn
                round
                flat
                icon="add"
                color="primary"
                class="tap-target"
                :aria-label="`增加${item.name}`"
                @click="setCount(item.id, countOf(item.id) + 1)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-expansion-item>
    </q-list>
  </q-page>

  <q-page v-else-if="notFound" padding class="text-center text-grey-7">
    找不到這個廠區
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw } from 'vue';
import { exportFile, useQuasar } from 'quasar';
import { categories, equipment } from '@/data/catalog';
import { db } from '@/db';
import type { Gym } from '@/types/domain';

const props = defineProps<{ id: string }>();

const $q = useQuasar();
const gym = ref<Gym>();
const notFound = ref(false);
const search = ref<string | null>('');
const onlyOwned = ref(false);

onMounted(async () => {
  gym.value = await db.gyms.get(props.id);
  notFound.value = !gym.value;
});

function countOf(equipmentId: string) {
  return gym.value?.inventory[equipmentId]?.count ?? 0;
}

const ownedTotal = computed(() => equipment.filter((e) => countOf(e.id) > 0).length);

const groups = computed(() => {
  const keyword = (search.value ?? '').trim().toLowerCase();
  return categories
    .map((category) => {
      const all = equipment.filter((e) => e.category === category.id);
      const items = all.filter(
        (e) =>
          (!onlyOwned.value || countOf(e.id) > 0) &&
          (!keyword || e.name.toLowerCase().includes(keyword) || e.nameEn.toLowerCase().includes(keyword)),
      );
      return {
        category,
        items,
        total: all.length,
        owned: all.filter((e) => countOf(e.id) > 0).length,
      };
    })
    .filter((group) => group.items.length > 0);
});

async function save() {
  if (!gym.value) return;
  gym.value.updatedAt = Date.now();
  // toRaw：Dexie 無法直接存 Vue 的 reactive proxy
  await db.gyms.put(structuredClone(toRaw(gym.value)));
}

async function setCount(equipmentId: string, count: number) {
  if (!gym.value) return;
  if (count <= 0) {
    delete gym.value.inventory[equipmentId];
  } else {
    gym.value.inventory[equipmentId] = { ...gym.value.inventory[equipmentId], count };
  }
  await save();
}

async function setMaxWeight(equipmentId: string, value: string | number | null) {
  const item = gym.value?.inventory[equipmentId];
  if (!item) return;
  const kg = Number(value);
  if (value === null || value === '' || !Number.isFinite(kg) || kg <= 0) {
    delete item.maxWeightKg;
  } else {
    item.maxWeightKg = kg;
  }
  await save();
}

function exportJson() {
  if (!gym.value) return;
  const ok = exportFile(`gym-${gym.value.name}.json`, JSON.stringify(toRaw(gym.value), null, 2), {
    mimeType: 'application/json',
  });
  if (ok !== true) {
    $q.notify({ type: 'negative', message: '匯出失敗，瀏覽器可能封鎖了下載' });
  }
}
</script>
