# RepRoute 登入串接與切換

程式依 auth-service `37ea8ca` 的 `docs/reproute-integration.md` 接入；未呼叫 `/userinfo`。Worker 從驗證後的 JWT 取得 `sub` 與 `email`。器材資料仍在本機 IndexedDB，既有資料未以 Access 身分索引，本次不移動或刪除器材資料。

## 行為

- 一般頁面首次載入呼叫 auth `/token`，cookie 隨請求送出，成功後呼叫 `/api/me`。
- 401 `login_required` 顯示登入入口；由使用者點擊登入，不自動循環跳轉。
- `/auth/callback` 驗證同分頁 state 與十分鐘效期，交易只能使用一次；成功回原站內頁面，錯誤可重試。
- Access token 僅存記憶體；sessionStorage 僅存交易，localStorage 僅存離線顯示的 id／email。
- 即將到期時換發，同分頁並行請求共用 Promise；讀取 API 401 最多換發重試一次。寫入請求不自動重送。
- 登出撤銷目前 refresh session，清除本機身分並停止換發；遠端失敗會明確顯示並提供重試。既有 IndexedDB 器材資料保留。
- localhost／workers.dev 沒有合法的同站 cookie 與已註冊 callback，因此不提供正式登入；本機用模擬端點驗證。

## Cloudflare 切換（使用者操作）

1. Workers & Pages → reproute → Settings → Domains & Routes → Add → Custom Domain，新增 `reproute.cirenjhong.com`，確認 HTTPS 正常。
2. auth-service 已註冊 origin `https://reproute.cirenjhong.com`、callback `https://reproute.cirenjhong.com/auth/callback`；確認部署中的設定與此一致。
3. 確認 auth-service D1 migration、Google OAuth、測試帳號／白名單與簽章 Secrets 已生效。Secret 直接設定在 Cloudflare，不貼到對話。
4. 確認 auth `/jwks`、discovery 不需 Access cookie 即回 JSON；動態端點 `/authorize`、`/callback/google`、`/token`、`/logout` 與 OPTIONS 能通行，並先確認限流與 WAF 安排。
5. 合併程式後等待自動部署。Zero Trust → Access → Applications，僅移除／調整 RepRoute 正式網域的 Access 規則，保留其他站點與預覽防護。
6. 無痕視窗測試：開 callback／重新整理可載入 SPA；登入、取消、非白名單、重新整理恢復、過期續期、兩分頁並行與登出重試。手機尺寸及 PWA 也各測一次。

目前環境只允許套件與 GitHub 相關網域，無法由此對正式 auth／RepRoute 執行完整 Google 登入驗收。正式登入完成前，不將單元測試通過視為上線成功。

## Review 與驗證

建議順序：`worker/auth/verify.ts` 與測試 → `src/auth/client.ts` 與測試 → composables → callback 與帳號選單 → `wrangler.jsonc` → 本文件。

本次本機驗證：

- `pnpm typecheck`、`pnpm lint:check`、`pnpm format:check`、`pnpm test`（47 個）與 `pnpm build` 通過。
- 使用 Wrangler 本機 Worker：`/api/health` 回 200；未帶 token 的 `/api/me` 回 401，callback 由 SPA 載入。
- Chromium 390 × 844 手機尺寸，模擬 auth 回應，實際點擊登入、callback 返回原頁、帳號顯示、登出失敗與重試；驗證 API Bearer、錯誤 state 不呼叫 token、query 被清理，無未處理的頁面例外。正式 Google／CORS／cookie 尚未驗收。
- 「故意改壞」8 項：移除 state 比對、交易效期、一次性交易、API 401 重試終止、JWT exp 必填、email 檢查、issuer 與 audience 驗證，各自讓測試斷言失敗；全部已還原。

驗收需確認 state 遺漏／錯誤／逾時／重送均不換 token、401 與非 JSON／403／5xx 分開處理、token 不進持久儲存及快取、登出後不被未完成請求恢復身分。正式驗收另依 auth-service 的整合文件逐項操作。

切換失敗由使用者恢復原部署與 RepRoute Access 防護，勿略過 JWT 驗證。舊部署設定可從 `main` 原版本取得。
