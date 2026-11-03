/** 動作資料庫型別，器材組合的外層為任一成立、內層為全部需要。 */
export interface Exercise {
  /** 穩定英文 id，供課表與替代動作引用。 */
  id: string;
  /** 中文動作名稱。 */
  name: string;
  /** 英文名稱，支援搜尋。 */
  nameEn: string;
  /** 動作模式。 */
  pattern: string;
  /** 主要肌群。 */
  primaryMuscles: string[];
  /** 次要肌群。 */
  secondaryMuscles: string[];
  /** 任一組器材齊全即可；空組表示徒手即可。 */
  equipment: string[][];
  /** 可進一步篩選的替代動作 id，不代表可無條件互換。 */
  alternatives: string[];
}
