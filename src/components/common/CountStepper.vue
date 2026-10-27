<!--
  數量加減器：「−  數字  ＋」。
  按鈕放大到至少 44px，健身房裡單手也點得到。
  數量不會低於 0；到 0 時減號自動停用。
-->
<template>
  <div class="row items-center no-wrap">
    <q-btn
      round
      flat
      icon="remove"
      class="tap-target"
      :disable="count === 0"
      :aria-label="`減少${label}`"
      @click="count = Math.max(0, count - 1)"
    />
    <div class="text-subtitle1 text-center" style="min-width: 24px">{{ count }}</div>
    <q-btn
      round
      flat
      icon="add"
      color="primary"
      class="tap-target"
      :aria-label="`增加${label}`"
      @click="count = count + 1"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** 用在按鈕的無障礙標籤，例如「增加啞鈴」 */
  label: string;
}>();

/** 目前數量（v-model） */
const count = defineModel<number>({ required: true });
</script>
