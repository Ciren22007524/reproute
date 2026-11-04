<!-- 今日訓練：從單堂或多日課表選一天開始，免登入保存到本機。 -->
<template>
  <q-page padding>
    <q-banner v-if="error" role="alert" class="q-mb-md bg-red-1 text-negative">
      {{ error
      }}<template #action
        ><q-btn flat label="重新載入" class="tap-target" :disable="busy" @click="reload"
      /></template>
    </q-banner>
    <q-spinner v-if="loading" aria-label="載入訓練中" />
    <template v-else-if="workout">
      <WorkoutSummary :workout="workout" />
      <div class="q-mb-sm">{{ dirty ? '尚有未儲存修改' : '進度已儲存，可稍後接續' }}</div>
      <WorkoutExercises
        :exercises="workout.exercises"
        :busy="busy || conflict"
        :readonly="false"
        @edit="edit"
        @toggle="toggle"
      />
      <div class="q-gutter-sm q-mb-lg">
        <q-btn
          label="儲存進度"
          color="primary"
          class="tap-target"
          :loading="busy"
          :disable="!dirty || conflict"
          @click="persist(false)"
        />
        <q-btn
          label="結束訓練"
          color="positive"
          class="tap-target"
          :disable="busy || conflict"
          @click="finish"
        />
        <q-btn
          label="放棄訓練"
          flat
          color="negative"
          class="tap-target"
          :disable="busy || conflict"
          @click="discard"
        />
      </div>
    </template>
    <template v-else-if="planOptions.length">
      <q-select
        v-model="planId"
        outlined
        emit-value
        map-options
        label="選擇課表"
        :options="planOptions"
        :disable="busy"
        class="q-mb-md"
      />
      <q-select
        v-model="dayId"
        outlined
        emit-value
        map-options
        label="選擇訓練日"
        :options="dayOptions"
        :disable="busy || !planId"
        class="q-mb-md"
      />
      <q-select
        v-model="gymId"
        outlined
        clearable
        emit-value
        map-options
        label="廠區（可不選）"
        :options="gymOptions"
        :disable="busy"
        class="q-mb-md"
      />
      <q-btn
        label="開始訓練"
        color="primary"
        class="full-width tap-target"
        :loading="busy"
        :disable="!planId || !dayId"
        @click="start"
      />
    </template>
    <template v-else-if="!error">
      <EmptyState
        icon="fitness_center"
        title="先建立你的課表"
        description="本機訓練不需登入。建立單堂或多日課表後，就能開始記錄每組表現。"
      />
      <q-btn to="/plans" label="前往課表" color="primary" class="tap-target" />
    </template>
  </q-page>
</template>
<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue';
import WorkoutSummary from '@/components/workout/WorkoutSummary.vue';
import WorkoutExercises from '@/components/workout/WorkoutExercises.vue';
import { useWorkout } from '@/composables/useWorkout';
const {
  planId,
  dayId,
  gymId,
  planOptions,
  dayOptions,
  gymOptions,
  workout,
  loading,
  busy,
  error,
  conflict,
  dirty,
  start,
  edit,
  toggle,
  persist,
  finish,
  discard,
  reload,
} = useWorkout();
</script>
