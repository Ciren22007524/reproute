<!-- 本機歷史紀錄清單，可查看快照或確認後刪除。 -->
<template>
  <q-page padding>
    <q-banner v-if="error" role="alert" class="q-mb-md"
      >{{ error
      }}<template #action
        ><q-btn flat label="重新載入" class="tap-target" @click="reload" /></template
    ></q-banner>
    <q-spinner v-if="loading" aria-label="載入紀錄中" />
    <q-list v-else-if="workouts.length" bordered separator class="rounded-borders">
      <q-item
        v-for="workout in workouts"
        :key="workout.id"
        clickable
        :to="`/history/${workout.id}`"
      >
        <q-item-section>
          <q-item-label>{{ workout.planName }}／{{ workout.dayName }}</q-item-label>
          <q-item-label caption
            >{{ new Date(workout.startedAt).toLocaleString('zh-TW') }}・{{
              workoutSummary(workout).completed
            }}
            組完成</q-item-label
          >
        </q-item-section>
        <q-item-section side
          ><q-btn
            flat
            round
            icon="delete_outline"
            class="tap-target"
            :aria-label="`刪除紀錄${workout.planName}`"
            :disable="busy"
            @click.prevent.stop="confirmDelete(workout)"
        /></q-item-section>
      </q-item>
    </q-list>
    <EmptyState
      v-else-if="!error"
      icon="insights"
      title="還沒有訓練紀錄"
      description="在今日訓練完成至少一組並結束訓練後，紀錄會保存在這台裝置。"
    />
  </q-page>
</template>
<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import { useWorkoutHistory } from '@/composables/useWorkoutHistory';
import { workoutSummary } from '@/utils/workouts';
const { workouts, loading, busy, error, reload, confirmDelete } = useWorkoutHistory();
</script>
