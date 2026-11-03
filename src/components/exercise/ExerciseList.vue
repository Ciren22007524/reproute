<!-- 顯示動作的肌群、器材選項及相同模式替代動作，不處理資料庫。 -->
<template>
  <q-list bordered class="rounded-borders">
    <q-expansion-item
      v-for="item in items"
      :key="item.id"
      :label="item.name"
      :caption="item.pattern"
    >
      <q-card>
        <q-card-section>
          <div class="text-caption q-mb-sm">{{ item.nameEn }}</div>
          <div>主要肌群：{{ item.primaryMuscles.join('、') }}</div>
          <div>次要肌群：{{ item.secondaryMuscles.join('、') || '無' }}</div>
          <div class="q-mt-sm">器材（以下任一組齊全即可）：</div>
          <div v-for="(group, index) in item.equipment" :key="index">
            {{ equipmentNames(group) }}
          </div>
          <div class="q-mt-sm">同模式替代動作{{ inventory ? '（依此廠區器材）' : '' }}：</div>
          <div>
            {{
              availableAlternatives(item, exercises, inventory)
                .map((e) => e.name)
                .join('、') || '目前無符合的替代動作'
            }}
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import { equipmentById } from '@/data/catalog';
import { exercises } from '@/data/exercises';
import type { GymInventory } from '@/types/domain';
import type { Exercise } from '@/types/exercise';
import { availableAlternatives } from '@/utils/exercises';

defineProps<{
  /** 已套用搜尋條件的動作。 */
  items: Exercise[];
  /** 選定廠區的清點結果；未選廠區時顯示所有替代動作。 */
  inventory: GymInventory | undefined;
}>();
function equipmentNames(group: string[]): string {
  return group.map((id) => equipmentById.get(id)?.name ?? id).join(' ＋ ') || '徒手，不需器材';
}
</script>
