<!-- 顯示訓練快照的動作與各組，歷史模式不提供編輯。 -->
<template>
  <q-expansion-item
    v-for="(exercise, index) in exercises"
    :key="exercise.id"
    :label="`${index + 1}. ${exercise.name}`"
    :caption="`每組目標 ${exercise.target} ${exercise.targetUnit === 'reps' ? '次' : '秒'}`"
    default-opened
    class="q-mb-md"
  >
    <WorkoutSetRow
      v-for="(set, setIndex) in exercise.sets"
      :key="set.id"
      :set="set"
      :index="setIndex"
      :unit="exercise.targetUnit"
      :busy="busy"
      :readonly="readonly"
      @edit="(field, value) => emit('edit', set.id, field, value)"
      @toggle="emit('toggle', set.id)"
    />
  </q-expansion-item>
</template>
<script setup lang="ts">
import type { WorkoutExercise } from '@/types/workout';
import WorkoutSetRow from './WorkoutSetRow.vue';
defineProps<{
  /** 訓練動作快照。 */
  exercises: WorkoutExercise[];
  /** 儲存時暫停。 */
  busy: boolean;
  /** 歷史唯讀。 */
  readonly: boolean;
}>();
const emit = defineEmits<{
  /** 修改指定組。 */
  edit: [
    setId: string,
    field: 'weightKg' | 'actual' | 'effort' | 'effortKind',
    value: string | number | null,
  ];
  /** 完成或取消指定組。 */
  toggle: [setId: string];
}>();
</script>
