/** 單堂與多日課表共用的資料結構；訓練紀錄日後以副本保存，不修改課表目標。 */
export type PlanMode = 'single' | 'multi';

/** 課表中的一個動作及每組目標。 */
export interface PlanExercise {
  /** 此列的唯一 id，同一動作可在課表重複出現。 */
  id: string;
  /** 內建動作 id。 */
  exerciseId: string;
  /** 目標組數。 */
  sets: number;
  /** 每組次數或持續秒數。 */
  target: number;
  /** 目標計量單位。 */
  targetUnit: 'reps' | 'seconds';
}

/** 多日課表的一天；單堂課表固定只有一個訓練單元。 */
export interface PlanDay {
  /** 訓練日的穩定 id，不以名稱或順序識別。 */
  id: string;
  /** 例如推、拉、腿或全身。 */
  name: string;
  /** 陣列順序就是執行順序。 */
  exercises: PlanExercise[];
}

/** 可自行選用的課表，不自動綁定星期或開始訓練。 */
export interface TrainingPlan {
  /** 前端建立的 UUID。 */
  id: string;
  /** 顯示名稱。 */
  name: string;
  /** 建立時選擇的模式。 */
  mode: PlanMode;
  /** 單堂恰好一個，多日至少一個。 */
  days: PlanDay[];
  /** 建立時間（毫秒）。 */
  createdAt: number;
  /** 最後更新時間，亦用於避免跨分頁覆寫。 */
  updatedAt: number;
  /** 軟刪除時間，預留同步刪除標記。 */
  deletedAt?: number;
}
