<!--
  清點頁的篩選列：搜尋框 + 「只顯示已勾選」開關。
  兩個值都用 v-model 交給父層（useInventoryFilter）管理。
-->
<template>
  <div class="column q-gutter-y-sm q-mb-sm">
    <q-input v-model="keyword" dense outlined clearable placeholder="搜尋器材">
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>
    <q-toggle v-model="onlyOwned" label="只顯示已勾選" />
  </div>
</template>

<script setup lang="ts">
/** 搜尋關鍵字（v-model:keyword）；按清除鈕時是 null */
const keyword = defineModel<string | null>('keyword', { required: true });
/** 只顯示已清點的器材（v-model:onlyOwned） */
const onlyOwned = defineModel<boolean>('onlyOwned', { required: true });
</script>
