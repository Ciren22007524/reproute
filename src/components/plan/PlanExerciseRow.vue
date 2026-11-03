<!-- 單一動作的目標與排序控制；手機用上下移，桌面也可拖曳把手。 -->
<template>
  <q-card flat bordered class="q-mb-sm" @dragover.prevent @drop.prevent="drop">
    <q-card-section>
      <div class="row items-center">
        <q-btn
          flat
          round
          icon="drag_indicator"
          class="tap-target"
          :aria-label="`拖曳${name}`"
          :draggable="!busy"
          :disable="busy"
          @dragstart="drag"
        />
        <div class="col text-subtitle1">{{ index + 1 }}. {{ name }}</div>
        <q-btn
          flat
          round
          icon="delete_outline"
          class="tap-target"
          :aria-label="`移除${name}`"
          :disable="busy"
          @click="emit('remove')"
        />
      </div>
      <div class="row q-col-gutter-sm q-mt-xs">
        <q-input
          class="col-4"
          outlined
          type="number"
          min="1"
          step="1"
          label="組數"
          :model-value="item.sets || ''"
          :disable="busy"
          @update:model-value="emit('edit', 'sets', $event)"
        />
        <q-input
          class="col-4"
          outlined
          type="number"
          min="1"
          step="1"
          label="每組目標"
          :model-value="item.target || ''"
          :disable="busy"
          @update:model-value="emit('edit', 'target', $event)"
        />
        <q-select
          class="col-4"
          outlined
          label="單位"
          emit-value
          map-options
          :model-value="item.targetUnit"
          :options="units"
          :disable="busy"
          @update:model-value="emit('edit', 'targetUnit', $event)"
        />
      </div>
      <div class="row justify-end q-mt-xs">
        <q-btn
          flat
          icon="arrow_upward"
          label="上移"
          class="tap-target"
          :aria-label="`上移${name}`"
          :disable="busy || index === 0"
          @click="emit('move', -1)"
        />
        <q-btn
          flat
          icon="arrow_downward"
          label="下移"
          class="tap-target"
          :aria-label="`下移${name}`"
          :disable="busy || last"
          @click="emit('move', 1)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { exerciseById } from '@/data/exercises';
import type { PlanExercise } from '@/types/plan';
const props = defineProps<{
  /** 此列資料。 */
  item: PlanExercise;
  /** 在訓練日內的順序。 */
  index: number;
  /** 是否最後一列。 */
  last: boolean;
  /** 儲存時暫停編輯。 */
  busy: boolean;
}>();
const emit = defineEmits<{
  /** 移除此列。 */
  remove: [];
  /** 相對移動一列。 */
  move: [offset: number];
  /** 修改目標欄位。 */
  edit: [field: 'sets' | 'target' | 'targetUnit', value: string | number | null];
  /** 拖曳列到此列位置。 */
  drop: [fromId: string];
}>();
const name = computed(() => exerciseById.get(props.item.exerciseId)?.name ?? '未知動作');
const units = [
  { label: '次', value: 'reps' },
  { label: '秒', value: 'seconds' },
];
function drag(event: DragEvent) {
  if (!props.busy) event.dataTransfer?.setData('text/plain', props.item.id);
}
function drop(event: DragEvent) {
  const fromId = event.dataTransfer?.getData('text/plain');
  if (!props.busy && fromId) emit('drop', fromId);
}
</script>
