/**
 * App 的核心資料型別。
 * 器材主清單（Equipment）是內建的靜態資料；廠區（Gym）是使用者自己建立、存在 IndexedDB 的資料。
 */

/** 器材分類 id，對應 data/equipment-catalog.json 的 categories */
export type EquipmentCategoryId =
  | 'free-weight'
  | 'rack-bench'
  | 'machine-upper'
  | 'machine-lower'
  | 'cable'
  | 'cardio'
  | 'accessory';

/** 器材分類，例如「自由重量」 */
export interface EquipmentCategory {
  id: EquipmentCategoryId;
  /** 顯示用的中文名稱 */
  name: string;
}

/** 器材主清單的一項：用「器材類型」而不是品牌型號 */
export interface Equipment {
  /** 穩定的英文 id，例如 dumbbell；廠區清點與之後的動作資料都用它對應 */
  id: string;
  name: string;
  nameEn: string;
  category: EquipmentCategoryId;
  /** 啞鈴、壺鈴這類需要記錄重量範圍的器材 */
  hasWeightRange?: boolean;
}

/** 某個廠區裡某項器材的清點結果 */
export interface GymEquipment {
  /** 數量；0 或不存在代表這間沒有 */
  count: number;
  /** 最重可到幾公斤（只對 hasWeightRange 的器材有意義） */
  maxWeightKg?: number;
  /** 備註，例如「常故障」（還沒有畫面可以輸入） */
  note?: string;
}

/** 廠區的器材清點結果：key 是器材主清單的 id */
export type GymInventory = Record<string, GymEquipment>;

/** 一個廠區（分館）以及它的器材清點結果 */
export interface Gym {
  /** UUID，在前端產生，之後同步到 D1 也用同一個 id */
  id: string;
  name: string;
  inventory: GymInventory;
  /** 建立時間（毫秒 timestamp） */
  createdAt: number;
  /** 最後修改時間（毫秒 timestamp）；清單排序與之後的同步都靠它 */
  updatedAt: number;
}
