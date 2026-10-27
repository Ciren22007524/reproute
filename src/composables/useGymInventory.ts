/**
 * 單一廠區的清點狀態：載入、改數量、改最重重量，每次修改都立即存回 IndexedDB。
 *
 * 計算規則都在 utils/inventory.ts，這裡只負責「狀態 + 存檔」。
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { equipment } from '@/data/catalog';
import { getGym, saveGym } from '@/db/gyms';
import type { Gym, GymInventory } from '@/types/domain';
import { ownedCount, parseMaxWeightKg, withCount, withMaxWeight } from '@/utils/inventory';

export function useGymInventory(gymId: string) {
  /**
   * 目前的廠區；載入中或找不到時是 undefined。
   * 用 shallowRef：每次修改都整個換成新物件（不在原物件上改），
   * 內層就不會變成 Vue 的 proxy，存進 IndexedDB 時才不會出錯。
   */
  const gym = shallowRef<Gym>();
  /** 載入完成且確定沒有這個廠區 */
  const notFound = ref(false);

  /** 目前的清點結果；還沒載入時當作空的 */
  const inventory = computed<GymInventory>(() => gym.value?.inventory ?? {});
  /** 已清點的器材種類數 */
  const ownedTotal = computed(() => ownedCount(inventory.value));
  /** 器材主清單的總數，用來顯示「已勾選 x / y 項」 */
  const catalogTotal = equipment.length;

  onMounted(async () => {
    gym.value = await getGym(gymId);
    notFound.value = !gym.value;
  });

  /** 換上新的 inventory、更新修改時間並存檔 */
  async function commit(next: GymInventory) {
    if (!gym.value) return;
    gym.value = { ...gym.value, inventory: next, updatedAt: Date.now() };
    await saveGym(gym.value);
  }

  /** 設定數量；設成 0 等於「這間沒有」 */
  function setCount(equipmentId: string, value: number) {
    return commit(withCount(inventory.value, equipmentId, value));
  }

  /** 設定最重重量；輸入框清空或填不合理的值時清除 */
  function setMaxWeight(equipmentId: string, value: string | number | null) {
    return commit(withMaxWeight(inventory.value, equipmentId, parseMaxWeightKg(value)));
  }

  return { gym, notFound, inventory, ownedTotal, catalogTotal, setCount, setMaxWeight };
}
