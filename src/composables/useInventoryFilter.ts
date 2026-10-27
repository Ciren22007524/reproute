/**
 * 清點頁的搜尋與「只顯示已勾選」篩選，產生要顯示的分類區塊。
 */
import { computed, ref, type Ref } from 'vue';
import { categories, equipment } from '@/data/catalog';
import type { GymInventory } from '@/types/domain';
import { groupEquipment } from '@/utils/inventory';

export function useInventoryFilter(inventory: Ref<GymInventory>) {
  /** 搜尋關鍵字；QInput 按清除鈕時會變成 null */
  const keyword = ref<string | null>('');
  /** 只顯示已清點（數量 > 0）的器材 */
  const onlyOwned = ref(false);

  /** 篩選後的分類區塊，沒有符合項目的分類不會出現 */
  const groups = computed(() =>
    groupEquipment(categories, equipment, inventory.value, {
      keyword: keyword.value ?? '',
      onlyOwned: onlyOwned.value,
    }),
  );

  /** 正在搜尋時，分類區塊預設展開，才看得到結果 */
  const isSearching = computed(() => !!keyword.value?.trim());

  return { keyword, onlyOwned, groups, isSearching };
}
