# RepRoute 進度與交接

> 更新：2026-11-04。每次工作告一段落時更新這份文件；新的 session 先讀這份和 `AGENTS.md`（Claude Code 與 Codex 共用的規則）。

**目前已合併：廠區器材清點與 JSON 匯出／匯入。** 動作資料庫已合併；雙模式課表已完成開發與本機驗證，正式部署結果尚未確認。新登入流程另見 PR #8，尚未切換。

## 進行中

開始工作時加一列，合併前移除，避免 Claude Code 與 Codex 同時做同一件事（規則見 `AGENTS.md`「多個 AI 工具一起開發」）。

| 分支                   | 工具  | 在做什麼                                     |
| ---------------------- | ----- | -------------------------------------------- |
| feature-auth-service   | Codex | PR #8 已轉草稿，不作全站入口                 |
| feature-local-workouts | Codex | PR #12 已驗證，Cloudflare 檢查失敗，尚未合併 |
| feature-full-backup    | Codex | 完整備份已驗證，依賴 PR #12，準備草稿 PR     |

## 部署狀態

| 項目            | 狀態                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| 正式網址        | `https://reproute.ciren22007524.workers.dev`                           |
| 自動部署        | Cloudflare Workers Builds 連接本 repo，合併到 `main` 就部署            |
| 登入            | Cloudflare Access（Google 登入，Scope All traffic，policy `only-me`）  |
| `main` 分支保護 | 需要 PR、禁止 force push 與刪除、approvals 0                           |
| PR 預覽建置     | PR #8 的 Workers Builds 失敗，原因尚未取得；舊紀錄懷疑預覽指令，未確認 |
| 開發環境        | `.devcontainer/` 支援 GitHub Codespaces                                |

## 已完成

| 項目       | 說明                                                                                  | 位置                                              |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 專案骨架   | Quasar PWA + Hono Worker；ESLint、Prettier、Vitest                                    | —                                                 |
| 器材主清單 | 72 項，7 個分類                                                                       | `data/equipment-catalog.json`                     |
| 廠區清點   | 新增廠區、逐項記數量、啞鈴等記最重重量、搜尋、只顯示已勾選、匯出 JSON；存在 IndexedDB | `src/pages/Gym*.vue`、`src/components/inventory/` |
| 登入驗證   | Worker 驗證 Access 的 JWT（簽章、iss、aud、exp），`GET /api/me`；14 個測試            | `worker/auth/`、`worker/app.ts`                   |
| 帳號選單   | 右上角顯示登入的 email 與狀態                                                         | `src/components/layout/AccountMenu.vue`           |
| 其他分頁   | 今日訓練、紀錄為預告；課表提供動作資料庫與單堂／多日編輯；今日訓練與紀錄待開發        | `src/pages/`                                      |

JSON 備份還原已合併（PR #9）；動作資料庫本機整合驗證共 46 個測試、型別、lint、格式與 PWA 建置通過，Chromium 390 × 844 實測搜尋、廠區／模式篩選、替代動作與載入後離線查詢，無頁面例外。正式部署尚未驗收。

## 下一步

### 1. 本機優先，雲端按功能授權（2026-11-04 定案）

本機清點、課表與訓練紀錄免登入；不再先切換全站登入，也不等待 D1。Google Drive 需獨立檔案授權；iCloud Drive 先以系統檔案選擇器備份；自家雲端服務才透過 auth-service。

PR #8 保留為未合併的舊版登入串接，不可直接拿來替換全站本機入口。既有 `/api/me` 仍維持 JWT 驗證，但 App 啟動不再呼叫它。正式 Cloudflare Access 設定未由程式變更：若正式站仍受 Access 保護，需使用者在後台調整，程式本身已不要求本機登入。

### 2. 之後的功能（依 `docs/requirements.md` 開發階段）

- JSON 匯入：PR #9 已合併至 `main`，正式部署尚未確認；匯入前預覽與驗證，一律新增副本、不覆蓋既有廠區。手機實測確認重複匯入、重新整理保存與匯出往返。
- 動作資料庫：PR #10 已合併，包含 21 個內建動作、動作模式／肌群搜尋、廠區器材篩選與同模式替代動作。資料規則與來源見 `docs/exercises.md`。
- 手動建課表：使用者已定案兩種模式都支援、建立時自行選擇。PR #11 已完成單堂／多日編輯、目標、排序與本機儲存，詳見 `docs/plans.md`。60 個測試及手機、雙分頁、儲存失敗與桌面拖曳實測通過，合併後可使用。
- 本機訓練：本次 PR 已實作開始、儲存各組重量／次數／秒數／RIR／RPE、接續、結束與歷史快照，75 個測試與手機完整流程、雙分頁及儲存失敗測試通過。PR #12 的 Workers Builds 失敗，GitHub 未提供錯誤細節，尚未合併。
- 下一步：完整資料 JSON 備份／還原已完成本機實作與手機驗證，依賴 PR #12；Google Drive 授權與備份待設定。
- v0.2：器材被占用時推薦替代動作與重排（核心功能）

## 待處理

- 雲端連接待提供 Google Drive Web OAuth Client ID 與核准來源；不向使用者索取機密。
- 完整備份涵蓋課表、訓練與廠區；89 個測試及手機驗證通過，交易失敗可整份回滾，匯入新增副本而不覆蓋原資料。格式與限制見 `docs/backup.md`。

- PR 預覽建置失敗（見上表），需要使用者改 Cloudflare 的 Preview command
- PWA 加到主畫面：已加 `useCredentialsForManifestTag`，使用者尚未實測
- 刪除舊命名的已合併分支（`refactor/component-split`、`docs/*`、`feat/api-me`、`fix/access-login`）：雲端環境不允許刪除遠端分支，需要使用者在 GitHub 刪除

## 文件說明

- `docs/requirements.md` 的「登入與使用者」寫的是 Access 方案，**已由 auth-service 取代**（見 `docs/decisions.md`）
- `docs/auth-service.md` 是登入服務的早期設計，**以 `auth-service` repo 的 `docs/design.md` 為準**
