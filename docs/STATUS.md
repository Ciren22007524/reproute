# RepRoute 進度與交接

> 更新：2026-11-04。本次以 Git、GitHub PR 與最新 main 重跑檢查查證。專案規則在 `AGENTS.md`，`CLAUDE.md` 僅匯入同一份規則。

## 已合併與未合併的界線

目前 `main` 為 `7860b32dee1c7697363a1f7585714961e46ed776`，已合併廠區清點、單一廠區 JSON 匯入／匯出（PR #9）、21 個內建動作與器材篩選（PR #10）、單堂／多日課表（PR #11）。IndexedDB 目前 main 到 version 2。

main 的今日訓練、歷史頁仍為預告，啟動時仍透過舊帳號選單呼叫 `/api/me`。免登入訓練、完整備份與後台變數保留都還在待合併 PR，不可當作已上線。

## 進行中與 PR

| 分支                               | PR                                                       | 狀態與負責工具                                                                    |
| ---------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `feature-preserve-cloudflare-vars` | [#14](https://github.com/Ciren22007524/reproute/pull/14) | Codex；後台變數保留，最新已查 head `007c4ae` 的 Workers Builds 失敗；本次交接任務 |
| `feature-local-workouts`           | [#12](https://github.com/Ciren22007524/reproute/pull/12) | Codex；免登入訓練，head `ec6aa9f` 的 Workers Builds 失敗，尚未合併                |
| `feature-full-backup`              | [#13](https://github.com/Ciren22007524/reproute/pull/13) | Codex；完整備份草稿，head `1ed9eb7`；包含並依賴 #12，Workers Builds 失敗          |
| `feature-auth-service`             | [#8](https://github.com/Ciren22007524/reproute/pull/8)   | Codex；草稿，舊全站登入串接，不應直接作為免登入工具的入口                         |
| `feature-handoff`                  | 本次文件 PR                                              | Codex；更新進度並交接 PR #14，不改程式或 Cloudflare 後台                          |

## 最新方向與文件落差

PR #12／#13 分支的 `docs/decisions.md` 已記錄 2026-11-04 決策：本機功能免登入；Google Drive 檔案權限獨立授權；iCloud 先以系統檔案匯出／匯入；使用自家雲端才選用 auth-service。登入或 D1 不再是本機訓練紀錄的前提。

這項新決策尚未隨 #12 合併進 main 的決策文件。因此 main 的 `docs/requirements.md`、`docs/plans.md` 與 README 中強制 Access／D1 的舊敘述存在落差，接手時應核對功能分支，不要繼續把登入當作本機使用前提。這次交接只處理 #14；其他文件與功能隨對應 PR 整合。

## 本次交接：部署保留 Cloudflare 變數（PR #14）

PR #14 已加入 `keep_vars: true`、移除設定檔寫死的 `AUTH_*` 值、新增空白 `.dev.vars.example` 與對應忽略例外；驗證邏輯只有來源註解變更，缺少設定仍拒絕 API 存取。

已安裝的 Wrangler schema 明確說明：預設依設定檔覆蓋／刪除一般變數，`keep_vars` 用來保留後台一般變數。同名值若再次放進 `vars`，仍可能覆蓋後台。Worker 執行期變數、Builds 建置變數與前端公開設定是不同層次；Google Web Client Secret 不得進前端，現行瀏覽器授權方案也不需要它。

外部阻礙：PR #14 的最新已查 Cloudflare 建置失敗，GitHub 僅提供建置連結，沒有根因訊息。需使用者提供該次建置最後的錯誤紀錄或已確認的建置／部署命令；不能將舊文件對 preview 指令的猜測當成根因。後台實際變數、機密與正式部署均未由本次交接讀取或驗證。

具體範圍、接手步驟與完成條件見 `docs/handoff.md`。

## 本次最新 main 檢查

基準 `7860b32`；Node `24.19.0`、pnpm `10.28.0`。2026-11-04 本次實際重跑：

| 指令                | 結果                            |
| ------------------- | ------------------------------- |
| `pnpm typecheck`    | 通過                            |
| `pnpm lint:check`   | 通過                            |
| `pnpm format:check` | 通過                            |
| `pnpm test`         | 4 個檔案、60 個測試通過         |
| `pnpm build`        | PWA build 通過，輸出 `dist/pwa` |

PR 描述另外記錄 #12 的 75 個測試、#13 的 89 個測試與手機實測、#14 的部署 dry-run 通過；這些屬各 PR 的先前紀錄，本次未在三個功能分支重跑，不等同正式環境驗收。

## 尚未完成

- 排除 Cloudflare 建置阻礙，先處理 #14；不得略過失敗檢查或以管理員方式強制合併。
- #12 與 #13 的驗證、衝突處理與依序整合，另行安排；不要與本次部署設定交接混做。
- Google Drive 授權與備份尚未實作；正式 origin、公開 Web Client ID、Google 後台設定是否已完成均待確認，勿索取 Client Secret。
- 原生 Android／iOS、雲端同步、器材占用時整堂課重排尚未完成。
- 正式 DNS、Access、Google OAuth 與遠端部署狀態未即時驗證；不要自行改後台防護。
