<!-- 課表的動作資料庫子頁，只組裝查詢狀態與列表。 -->
<template>
  <q-page padding>
    <q-input v-model="keyword" outlined clearable label="搜尋動作或肌群" class="q-mb-sm" />
    <q-select
      v-model="pattern"
      outlined
      clearable
      label="動作模式"
      :options="patterns"
      class="q-mb-sm"
    />
    <q-select
      v-model="gymId"
      outlined
      clearable
      emit-value
      map-options
      label="依廠區器材篩選"
      :options="gymOptions"
      :disable="loading || !!error"
      class="q-mb-sm"
    />
    <q-banner v-if="error" role="alert" class="q-mb-sm">
      {{ error }}
      <template #action><q-btn flat label="重試" class="tap-target" @click="reload" /></template>
    </q-banner>
    <div v-if="!loading && !error && !gyms.length" class="q-mb-sm">
      尚未建立廠區。可先瀏覽所有動作，或到「廠區」清點器材後再篩選。
    </div>
    <div class="text-caption q-mb-sm">
      {{ results.length }} 個動作；器材相容不代表重量或身體狀況適合，請依自身能力選擇。
    </div>
    <ExerciseList v-if="results.length" :items="results" :inventory="inventory" />
    <EmptyState
      v-else
      icon="search_off"
      title="沒有符合的動作"
      description="請調整關鍵字、動作模式或廠區篩選。"
    />
  </q-page>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import ExerciseList from '@/components/exercise/ExerciseList.vue';
import { useExerciseCatalog } from '@/composables/useExerciseCatalog';

const {
  keyword,
  pattern,
  gymId,
  gyms,
  patterns,
  gymOptions,
  results,
  inventory,
  loading,
  error,
  reload,
} = useExerciseCatalog();
</script>
