<!--
  清點清單中的一列器材：左邊是名稱，右邊是數量加減器。
  器材需要記錄重量（hasWeightRange）且已經清點時，名稱下方多一個「最重」輸入框。
-->
<template>
  <q-item class="q-py-sm">
    <q-item-section>
      <q-item-label>{{ item.name }}</q-item-label>
      <q-item-label caption>{{ item.nameEn }}</q-item-label>
      <MaxWeightInput
        v-if="item.hasWeightRange && count > 0"
        :model-value="maxWeightKg"
        class="q-mt-xs"
        @update:model-value="(value) => emit('update:maxWeight', value)"
      />
    </q-item-section>

    <q-item-section side>
      <CountStepper
        :model-value="count"
        :label="item.name"
        @update:model-value="(value) => emit('update:count', value)"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import CountStepper from '@/components/common/CountStepper.vue';
import MaxWeightInput from '@/components/inventory/MaxWeightInput.vue';
import type { Equipment } from '@/types/domain';

defineProps<{
  /** 器材主清單中的這一項 */
  item: Equipment;
  /** 這個廠區的數量 */
  count: number;
  /** 這個廠區記錄的最重重量（公斤） */
  maxWeightKg?: number | undefined;
}>();

const emit = defineEmits<{
  'update:count': [count: number];
  'update:maxWeight': [value: string | number | null];
}>();
</script>
