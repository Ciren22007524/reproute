<!-- 唯讀的訓練時間與完成組數摘要，計時動作不計入公斤次數總量。 -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6">{{ workout.planName }}／{{ workout.dayName }}</div>
      <div>{{ new Date(workout.startedAt).toLocaleString('zh-TW') }}</div>
      <div>{{ workout.gymName || '未指定廠區' }}</div>
      <div>已完成 {{ summary.completed }}／{{ summary.total }} 組</div>
      <div v-if="workout.endedAt">
        訓練時間 {{ Math.max(0, Math.round((workout.endedAt - workout.startedAt) / 60000)) }} 分鐘
      </div>
      <div>
        重量總量 {{ summary.volumeKg.toLocaleString('zh-TW') }} kg・次（僅計已完成的次數動作）
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { Workout } from '@/types/workout';
import { workoutSummary } from '@/utils/workouts';
const props = defineProps<{
  /** 本次訓練快照。 */
  workout: Workout;
}>();
const summary = computed(() => workoutSummary(props.workout));
</script>
