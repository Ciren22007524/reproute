/** 動作搜尋與器材相容性判斷，不依賴頁面或資料庫。 */
import type { GymInventory } from '../types/domain';
import type { Exercise } from '../types/exercise';

/** 至少一組器材齊全才可執行；器材數量為零視為沒有。 */
export function canPerform(exercise: Exercise, inventory: GymInventory): boolean {
  return exercise.equipment.some((group) => group.every((id) => (inventory[id]?.count ?? 0) > 0));
}

/** 以中英文名稱與肌群搜尋；可指定模式及廠區器材。 */
export function filterExercises(
  items: Exercise[],
  keyword: string,
  pattern: string | null,
  inventory?: GymInventory,
): Exercise[] {
  const query = keyword.trim().toLowerCase();
  return items.filter(
    (item) =>
      (!pattern || item.pattern === pattern) &&
      (!query ||
        [item.name, item.nameEn, ...item.primaryMuscles, ...item.secondaryMuscles]
          .join(' ')
          .toLowerCase()
          .includes(query)) &&
      (inventory === undefined || canPerform(item, inventory)),
  );
}

/** 替代動作保留相同模式與主要肌群交集，再依廠區實際器材過濾。 */
export function availableAlternatives(
  exercise: Exercise,
  items: Exercise[],
  inventory?: GymInventory,
): Exercise[] {
  return items.filter(
    (item) =>
      item.id !== exercise.id &&
      exercise.alternatives.includes(item.id) &&
      item.pattern === exercise.pattern &&
      item.primaryMuscles.some((muscle) => exercise.primaryMuscles.includes(muscle)) &&
      (inventory === undefined || canPerform(item, inventory)),
  );
}
