<!--
  一個可展開的器材分類（例如「自由重量 2 / 7」），裡面列出該分類的器材。
  本身不存任何狀態，數量從 inventory 讀，修改透過事件交給頁面處理。
-->
<template>
  <q-expansion-item
    :label="group.category.name"
    :caption="`${group.owned} / ${group.total}`"
    :default-opened="defaultOpened"
    header-class="text-weight-medium"
  >
    <EquipmentRow
      v-for="item in group.items"
      :key="item.id"
      :item="item"
      :count="countOf(inventory, item.id)"
      :max-weight-kg="inventory[item.id]?.maxWeightKg"
      @update:count="(count) => emit('setCount', item.id, count)"
      @update:max-weight="(value) => emit('setMaxWeight', item.id, value)"
    />
  </q-expansion-item>
</template>

<script setup lang="ts">
import EquipmentRow from '@/components/inventory/EquipmentRow.vue';
import type { GymInventory } from '@/types/domain';
import { countOf, type EquipmentGroup } from '@/utils/inventory';

defineProps<{
  /** 這個分類與篩選後要顯示的器材 */
  group: EquipmentGroup;
  /** 整個廠區的清點結果 */
  inventory: GymInventory;
  /** 一開始是否展開（搜尋時展開才看得到結果） */
  defaultOpened?: boolean;
}>();

const emit = defineEmits<{
  setCount: [equipmentId: string, count: number];
  setMaxWeight: [equipmentId: string, value: string | number | null];
}>();
</script>
