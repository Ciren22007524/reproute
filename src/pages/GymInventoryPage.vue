<!--
  器材清點頁（/gyms/:id）。
  只負責把組件組起來：
    狀態與存檔 → useGymInventory
    搜尋與分組 → useInventoryFilter
    畫面       → components/inventory/*
-->
<template>
  <q-page v-if="gym" padding>
    <InventoryHeader
      :name="gym.name"
      :owned="ownedTotal"
      :total="catalogTotal"
      @export="onExport"
    />

    <InventoryFilters v-model:keyword="keyword" v-model:only-owned="onlyOwned" />

    <q-list bordered class="rounded-borders">
      <EquipmentCategoryGroup
        v-for="group in groups"
        :key="group.category.id"
        :group="group"
        :inventory="inventory"
        :default-opened="isSearching"
        @set-count="setCount"
        @set-max-weight="setMaxWeight"
      />
    </q-list>
  </q-page>

  <q-page v-else-if="notFound" padding class="text-center text-grey-7">找不到這個廠區</q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import EquipmentCategoryGroup from '@/components/inventory/EquipmentCategoryGroup.vue';
import InventoryFilters from '@/components/inventory/InventoryFilters.vue';
import InventoryHeader from '@/components/inventory/InventoryHeader.vue';
import { useGymInventory } from '@/composables/useGymInventory';
import { useInventoryFilter } from '@/composables/useInventoryFilter';
import { exportGymJson } from '@/utils/exportGym';

const props = defineProps<{
  /** 廠區 id，來自網址 /gyms/:id */
  id: string;
}>();

const $q = useQuasar();
const { gym, notFound, inventory, ownedTotal, catalogTotal, setCount, setMaxWeight } =
  useGymInventory(props.id);
const { keyword, onlyOwned, groups, isSearching } = useInventoryFilter(inventory);

function onExport() {
  if (gym.value && !exportGymJson(gym.value)) {
    $q.notify({ type: 'negative', message: '匯出失敗，瀏覽器可能封鎖了下載' });
  }
}
</script>
