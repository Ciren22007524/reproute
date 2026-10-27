/**
 * 前端與 Worker 共用的登入相關型別。
 * 這個資料夾只放型別與純資料，不能 import 瀏覽器或 Worker 專屬的東西。
 */

/** GET /api/me 的回應：目前登入的使用者 */
export interface CurrentUser {
  /** 使用者 id，來自 JWT 的 sub，不會變；之後 D1 的 user_id 就用它 */
  id: string;
  /** 登入用的 email，只用來顯示 */
  email: string;
}

/** /api/* 驗證失敗時的回應 */
export interface AuthErrorBody {
  error: 'unauthorized' | 'auth_not_configured';
  message: string;
}
