<!--
  「最重 __ kg」輸入框，用在啞鈴、壺鈴這類需要記錄重量上限的器材。
  直接把輸入框的原始值往外丟，轉換與驗證交給 utils/inventory 的 parseMaxWeightKg。
-->
<template>
  <q-input
    :model-value="modelValue ?? null"
    type="number"
    inputmode="decimal"
    dense
    outlined
    suffix="kg"
    label="最重"
    style="max-width: 140px"
    @update:model-value="(value) => emit('update:modelValue', value)"
  />
</template>

<script setup lang="ts">
defineProps<{
  /** 目前記錄的最重重量（公斤）；沒填時是 undefined */
  modelValue?: number | undefined;
}>();

const emit = defineEmits<{
  /** 使用者輸入的原始值（可能是空字串或 null） */
  'update:modelValue': [value: string | number | null];
}>();
</script>
