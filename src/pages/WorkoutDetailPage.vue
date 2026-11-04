<!-- 已完成訓練的唯讀詳情，不以目前課表覆蓋歷史。 -->
<template>
  <q-page padding>
    <q-banner v-if="error" role="alert"
      >{{ error
      }}<template #action><q-btn flat label="重試" class="tap-target" @click="reload" /></template
    ></q-banner>
    <q-spinner v-if="loading" aria-label="載入紀錄中" />
    <template v-else-if="workout"
      ><WorkoutSummary :workout="workout" /><WorkoutExercises
        :exercises="workout.exercises"
        :busy="false"
        :readonly="true"
    /></template>
    <EmptyState
      v-else-if="!error"
      icon="search_off"
      title="找不到已完成的紀錄"
      description="這次訓練可能尚未結束或已刪除。"
    />
  </q-page>
</template>
<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import WorkoutSummary from '@/components/workout/WorkoutSummary.vue';
import WorkoutExercises from '@/components/workout/WorkoutExercises.vue';
import { useWorkoutDetail } from '@/composables/useWorkoutDetail';
const props = defineProps<{
  /** 訓練 id。 */
  id: string;
}>();
const { workout, loading, error, reload } = useWorkoutDetail(() => props.id);
</script>
