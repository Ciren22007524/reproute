<!--
  廠區清單中的一列：名稱、已清點幾項，右邊有刪除鈕。
  點整列會進入該廠區的清點頁。
-->
<template>
  <q-item clickable :to="`/gyms/${gym.id}`">
    <q-item-section avatar>
      <q-icon name="store" color="primary" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ gym.name }}</q-item-label>
      <q-item-label caption>已清點 {{ ownedCount(gym.inventory) }} 項器材</q-item-label>
    </q-item-section>

    <q-item-section side>
      <!-- .prevent.stop：避免點刪除鈕時同時觸發整列的連結 -->
      <q-btn
        flat
        round
        dense
        icon="delete_outline"
        :aria-label="`刪除${gym.name}`"
        @click.prevent.stop="emit('delete', gym)"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { Gym } from '@/types/domain';
import { ownedCount } from '@/utils/inventory';

defineProps<{
  gym: Gym;
}>();

const emit = defineEmits<{
  /** 按下刪除鈕（確認對話框由父層處理） */
  delete: [gym: Gym];
}>();
</script>
