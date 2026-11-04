<!-- 一組實際重量、次數／秒數與主觀強度，完成時由父層儲存。 -->
<template>
  <q-card flat bordered class="q-mb-sm">
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">
        第 {{ index + 1 }} 組{{ set.completed ? '・已完成' : '' }}
      </div>
      <div class="row q-col-gutter-sm">
        <q-input
          class="col-6"
          outlined
          type="number"
          min="0"
          step="any"
          label="重量（kg，可留白）"
          :model-value="set.weightKg"
          :disable="busy || readonly"
          @update:model-value="emit('edit', 'weightKg', $event)"
        />
        <q-input
          class="col-6"
          outlined
          type="number"
          min="1"
          step="1"
          :label="unit === 'reps' ? '實際次數' : '實際秒數'"
          :model-value="set.actual"
          :disable="busy || readonly"
          @update:model-value="emit('edit', 'actual', $event)"
        />
        <q-select
          class="col-6 q-mt-sm"
          outlined
          label="強度方式"
          emit-value
          map-options
          :model-value="set.effortKind"
          :options="efforts"
          :disable="busy || readonly"
          @update:model-value="emit('edit', 'effortKind', $event)"
        />
        <q-input
          class="col-6 q-mt-sm"
          outlined
          type="number"
          :min="set.effortKind === 'rir' ? 0 : 1"
          max="10"
          :step="set.effortKind === 'rir' ? 1 : 0.5"
          :label="`${set.effortKind.toUpperCase()}（可留白）`"
          :model-value="set.effort"
          :disable="busy || readonly"
          @update:model-value="emit('edit', 'effort', $event)"
        />
      </div>
      <q-btn
        v-if="!readonly"
        :label="set.completed ? '取消本組完成' : '完成本組並儲存'"
        :color="set.completed ? 'positive' : 'primary'"
        class="full-width tap-target q-mt-sm"
        :disable="busy"
        @click="emit('toggle')"
      />
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import type { WorkoutSet } from '@/types/workout';
defineProps<{
  /** 該組紀錄。 */
  set: WorkoutSet;
  /** 組的順序。 */
  index: number;
  /** 次數或秒數。 */
  unit: 'reps' | 'seconds';
  /** 寫入時鎖定輸入。 */
  busy: boolean;
  /** 歷史唯讀。 */
  readonly: boolean;
}>();
const emit = defineEmits<{
  /** 修改一個欄位。 */
  edit: [field: 'weightKg' | 'actual' | 'effort' | 'effortKind', value: string | number | null];
  /** 切換完成並保存。 */
  toggle: [];
}>();
const efforts = [
  { label: 'RIR', value: 'rir' },
  { label: 'RPE', value: 'rpe' },
];
</script>
