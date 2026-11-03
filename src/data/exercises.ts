/** 自行整理的內建動作與器材對應，不含外部圖文；資料來源說明見 docs/exercises.md。 */
import raw from '../../data/exercise-catalog.json';
import type { Exercise } from '../types/exercise';

/** 內建動作，供查詢、課表與後續替代動作推薦共用。 */
export const exercises: Exercise[] = raw;

/** 以穩定 id 查詢動作。 */
export const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
