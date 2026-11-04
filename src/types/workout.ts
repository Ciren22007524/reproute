/** 本機訓練紀錄，保留開始時的課表與廠區名稱快照。 */
export interface WorkoutSet {
  /** 每組的穩定 id。 */
  id: string;
  /** 實際重量，徒手可留白或填零。 */
  weightKg: number | null;
  /** 實際次數或秒數，依動作的 targetUnit 解讀。 */
  actual: number | null;
  /** 主觀強度的記錄方式。 */
  effortKind: 'rir' | 'rpe';
  /** 可選的主觀強度。 */
  effort: number | null;
  /** 是否完成本組。 */
  completed: boolean;
}

/** 訓練動作快照，之後修改課表不影響歷史。 */
export interface WorkoutExercise {
  /** 訓練中的動作列 id。 */
  id: string;
  /** 動作資料庫 id。 */
  exerciseId: string;
  /** 開始時的動作名稱。 */
  name: string;
  /** 原定每組目標。 */
  target: number;
  /** 目標與實際數值的單位。 */
  targetUnit: 'reps' | 'seconds';
  /** 實際各組資料。 */
  sets: WorkoutSet[];
}

/** 一次訓練；同裝置僅一筆 active，結束後唯讀。 */
export interface Workout {
  /** 前端 UUID。 */
  id: string;
  /** 課表來源，課表刪除後仍保留歷史。 */
  planId: string;
  /** 訓練日來源。 */
  dayId: string;
  /** 開始時的課表名稱。 */
  planName: string;
  /** 開始時的訓練日名稱。 */
  dayName: string;
  /** 可選的廠區來源。 */
  gymId: string | null;
  /** 開始時的廠區名稱。 */
  gymName: string | null;
  /** 訓練狀態。 */
  status: 'active' | 'completed' | 'discarded';
  /** 開始時間（毫秒）。 */
  startedAt: number;
  /** 最後儲存版本，跨分頁更新須一致。 */
  updatedAt: number;
  /** 結束時間；進行中為 null。 */
  endedAt: number | null;
  /** 動作與各組快照。 */
  exercises: WorkoutExercise[];
  /** 軟刪除標記。 */
  deletedAt?: number;
}
