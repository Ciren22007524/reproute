<!-- 課表清單與模式選擇，資料操作交給 composable。 -->
<template>
  <q-page padding>
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        label="新增課表"
        icon="add"
        color="primary"
        class="tap-target"
        @click="creating = true"
      />
      <q-btn
        to="/plans/exercises"
        label="瀏覽動作資料庫"
        icon="fitness_center"
        outline
        class="tap-target"
      />
    </div>
    <q-banner v-if="error" role="alert" class="q-mb-md">
      {{ error }}
      <template #action
        ><q-btn flat label="重新載入" class="tap-target" @click="reload"
      /></template>
    </q-banner>
    <q-spinner v-if="loading" aria-label="載入課表中" />
    <q-list v-else-if="plans.length" bordered separator class="rounded-borders">
      <q-item v-for="plan in plans" :key="plan.id" clickable :to="`/plans/${plan.id}`">
        <q-item-section>
          <q-item-label>{{ plan.name }}</q-item-label>
          <q-item-label caption>{{
            plan.mode === 'single' ? '單堂課表' : `多日課表・${plan.days.length} 個訓練日`
          }}</q-item-label>
        </q-item-section>
        <q-item-section side
          ><q-btn
            flat
            round
            icon="delete_outline"
            class="tap-target"
            :aria-label="`刪除課表${plan.name}`"
            :disable="deleting"
            @click.prevent.stop="confirmDelete(plan)"
        /></q-item-section>
      </q-item>
    </q-list>
    <EmptyState
      v-else-if="!error"
      icon="event_note"
      title="還沒有課表"
      description="新增單堂課表或多日課表，自行安排動作與每組目標。"
    />
    <PlanCreateDialog v-model="creating" @create="create" />
  </q-page>
</template>
<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import PlanCreateDialog from '@/components/plan/PlanCreateDialog.vue';
import { usePlanList } from '@/composables/usePlanList';
const { plans, loading, error, creating, deleting, reload, create, confirmDelete } = usePlanList();
</script>
