<!-- 共用訓練日編輯區，僅顯示資料並發出編輯事件。 -->
<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div v-if="multi" class="row items-center q-gutter-xs q-mb-md">
        <q-input
          class="col"
          outlined
          label="訓練日名稱"
          :model-value="day.name"
          :disable="busy"
          @update:model-value="emit('rename', $event)"
        />
        <q-btn
          flat
          round
          icon="arrow_upward"
          class="tap-target"
          :aria-label="`上移訓練日${day.name}`"
          :disable="busy || first"
          @click="emit('move-day', -1)"
        />
        <q-btn
          flat
          round
          icon="arrow_downward"
          class="tap-target"
          :aria-label="`下移訓練日${day.name}`"
          :disable="busy || last"
          @click="emit('move-day', 1)"
        />
        <q-btn
          flat
          round
          icon="delete_outline"
          class="tap-target"
          :aria-label="`刪除訓練日${day.name}`"
          :disable="busy || onlyDay"
          @click="emit('remove-day')"
        />
      </div>
      <PlanExerciseRow
        v-for="(item, index) in day.exercises"
        :key="item.id"
        :item="item"
        :index="index"
        :last="index === day.exercises.length - 1"
        :busy="busy"
        @remove="emit('remove-exercise', item.id)"
        @edit="(field, value) => emit('edit-exercise', item.id, field, value)"
        @move="(offset) => move(index, offset)"
        @drop="(fromId) => emit('move-exercise', fromId, item.id)"
      />
      <div v-if="!day.exercises.length" class="text-grey-7 q-mb-sm">尚未加入動作。</div>
      <q-select
        v-model="selected"
        outlined
        use-input
        clearable
        emit-value
        map-options
        label="選擇動作（可搜尋）"
        :options="options"
        :disable="busy"
        @filter="filter"
      />
      <q-btn
        label="加入動作"
        icon="add"
        color="primary"
        class="tap-target q-mt-sm"
        :disable="busy || !selected"
        @click="add"
      />
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { exercises } from '@/data/exercises';
import type { PlanDay } from '@/types/plan';
import PlanExerciseRow from './PlanExerciseRow.vue';
const props = defineProps<{
  /** 此訓練日與動作。 */
  day: PlanDay;
  /** 多日模式才顯示訓練日管理。 */
  multi: boolean;
  /** 是否第一天。 */
  first: boolean;
  /** 是否最後一天。 */
  last: boolean;
  /** 只剩一天時不允許刪除。 */
  onlyDay: boolean;
  /** 儲存時暫停編輯。 */
  busy: boolean;
}>();
const emit = defineEmits<{
  /** 修改訓練日名稱。 */
  rename: [value: string | number | null];
  /** 移除訓練日。 */
  'remove-day': [];
  /** 調整訓練日順序。 */
  'move-day': [offset: number];
  /** 選定要加入的動作。 */
  'add-exercise': [exerciseId: string];
  /** 移除某列動作。 */
  'remove-exercise': [itemId: string];
  /** 修改某列目標。 */
  'edit-exercise': [
    itemId: string,
    field: 'sets' | 'target' | 'targetUnit',
    value: string | number | null,
  ];
  /** 將動作移動到另一列位置。 */
  'move-exercise': [fromId: string, toId: string];
}>();
const selected = ref<string | null>(null);
const allOptions = exercises.map((item) => ({
  label: item.name,
  value: item.id,
  search: `${item.name} ${item.nameEn}`.toLowerCase(),
}));
const options = shallowRef(allOptions);
function filter(value: string, update: (fn: () => void) => void) {
  update(() => {
    options.value = allOptions.filter((item) => item.search.includes(value.trim().toLowerCase()));
  });
}
function add() {
  if (selected.value) {
    emit('add-exercise', selected.value);
    selected.value = null;
  }
}
function move(index: number, offset: number) {
  const from = props.day.exercises[index];
  const to = props.day.exercises[index + offset];
  if (from && to) emit('move-exercise', from.id, to.id);
}
</script>
