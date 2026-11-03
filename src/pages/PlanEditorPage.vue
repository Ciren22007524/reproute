<!-- 課表編輯頁，組裝共用編輯器與儲存狀態，不直接存取資料庫。 -->
<template>
  <q-page padding>
    <q-banner v-if="error" role="alert" class="q-mb-md bg-red-1 text-negative">
      {{ error }}
      <template #action
        ><q-btn
          v-if="conflict || !plan"
          flat
          label="重新載入"
          class="tap-target"
          :disable="saving"
          @click="reload"
      /></template>
    </q-banner>
    <q-spinner v-if="loading" aria-label="載入課表中" />
    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      title="找不到課表"
      description="課表可能已刪除，請返回清單選擇。"
    />
    <template v-else-if="plan">
      <div class="row items-center q-mb-md">
        <q-badge :label="plan.mode === 'single' ? '單堂課表' : '多日課表'" />
        <div class="q-ml-sm text-caption">
          {{ dirty ? '尚未儲存' : id === 'new' ? '新課表' : '已儲存到這台裝置' }}
        </div>
      </div>
      <q-input
        outlined
        label="課表名稱"
        class="q-mb-md"
        :model-value="plan.name"
        :disable="saving"
        @update:model-value="rename"
      />
      <PlanDayEditor
        v-for="(day, index) in plan.days"
        :key="day.id"
        :day="day"
        :multi="plan.mode === 'multi'"
        :first="index === 0"
        :last="index === plan.days.length - 1"
        :only-day="plan.days.length === 1"
        :busy="saving"
        @rename="(value) => renameDay(day.id, value)"
        @remove-day="removeDay(day.id)"
        @move-day="(offset) => moveDay(index, offset)"
        @add-exercise="(exerciseId) => addExercise(day.id, exerciseId)"
        @remove-exercise="(itemId) => removeExercise(day.id, itemId)"
        @edit-exercise="(itemId, field, value) => editExercise(day.id, itemId, field, value)"
        @move-exercise="(fromId, toId) => moveExercise(day.id, fromId, toId)"
      />
      <q-btn
        v-if="plan.mode === 'multi'"
        outline
        label="新增訓練日"
        icon="add"
        class="tap-target q-mb-md"
        :disable="saving"
        @click="addDay"
      />
      <div class="q-mb-md">可拖曳動作把手，或用上移／下移調整順序。組數與目標可自行修改。</div>
      <q-btn
        label="儲存課表"
        color="primary"
        class="full-width tap-target q-mb-lg"
        :loading="saving"
        :disable="!dirty || conflict"
        @click="save"
      />
    </template>
  </q-page>
</template>
<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import PlanDayEditor from '@/components/plan/PlanDayEditor.vue';
import { usePlanEditor } from '@/composables/usePlanEditor';
const props = defineProps<{
  /** 課表 id；new 代表建立新課表。 */
  id: string;
}>();
const {
  plan,
  loading,
  saving,
  error,
  conflict,
  notFound,
  dirty,
  rename,
  renameDay,
  addDay,
  removeDay,
  moveDay,
  addExercise,
  removeExercise,
  editExercise,
  moveExercise,
  save,
  reload,
} = usePlanEditor(() => props.id);
</script>
