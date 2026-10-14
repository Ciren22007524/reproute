export type EquipmentCategoryId =
  | 'free-weight'
  | 'rack-bench'
  | 'machine-upper'
  | 'machine-lower'
  | 'cable'
  | 'cardio'
  | 'accessory';

export interface EquipmentCategory {
  id: EquipmentCategoryId;
  name: string;
}

/** 器材主清單的一項：用「器材類型」而不是品牌型號 */
export interface Equipment {
  id: string;
  name: string;
  nameEn: string;
  category: EquipmentCategoryId;
  /** 啞鈴、壺鈴這類需要記錄重量範圍的器材 */
  hasWeightRange?: boolean;
}

export interface GymEquipment {
  /** 數量；0 或不存在代表這間沒有 */
  count: number;
  /** 最重可到幾公斤（只對 hasWeightRange 的器材有意義） */
  maxWeightKg?: number;
  note?: string;
}

/** 一個廠區（分館）以及它的器材清點結果 */
export interface Gym {
  id: string;
  name: string;
  inventory: Record<string, GymEquipment>;
  createdAt: number;
  updatedAt: number;
}
