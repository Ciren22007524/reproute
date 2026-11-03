# RepRoute 進度與交接

> 更新：2026-11-03。每次工作告一段落時更新這份文件；新的 session 先讀這份和 `AGENTS.md`（Claude Code 與 Codex 共用的規則）。

**目前已合併：廠區器材清點與 JSON 匯出／匯入。** 動作資料庫已完成開發與本機驗證；正式部署結果尚未確認。新登入流程另見 PR #8，尚未切換。

## 進行中

開始工作時加一列，合併前移除，避免 Claude Code 與 Codex 同時做同一件事（規則見 `AGENTS.md`「多個 AI 工具一起開發」）。

| 分支                 | 工具  | 在做什麼                                            |
| -------------------- | ----- | --------------------------------------------------- |
| feature-auth-service | Codex | PR #8：登入串接待 Cloudflare 建置診斷與正式設定驗收 |

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
| 其他分頁   | 今日訓練、紀錄為預告；課表提供動作資料庫入口，手動課表待開發                          | `src/pages/`                                      |

JSON 備份還原已合併（PR #9）；動作資料庫本機整合驗證共 46 個測試、型別、lint、格式與 PWA 建置通過，Chromium 390 × 844 實測搜尋、廠區／模式篩選、替代動作與載入後離線查詢，無頁面例外。正式部署尚未驗收。

## 下一步

### 1. auth-service 登入切換待正式環境驗收

PR #8（`feature-auth-service`）已實作登入、callback、記憶體 token、續期、Bearer API 與登出；先前本機 47 個測試通過。Cloudflare Workers Builds 失敗原因尚未取得，不將舊文件的預覽指令推測當成已確認根因。

使用者仍需確認正式網域 `reproute.cirenjhong.com`、auth-service Google OAuth／D1／端點設定，完成正式登入驗收後才切換。具體流程見 PR #8 的 `docs/auth-integration.md`。

### 2. 之後的功能（依 `docs/requirements.md` 開發階段）

- JSON 匯入：PR #9 已合併至 `main`，正式部署尚未確認；匯入前預覽與驗證，一律新增副本、不覆蓋既有廠區。手機實測確認重複匯入、重新整理保存與匯出往返。
- 動作資料庫：`feature-exercise-catalog` 已完成 21 個內建動作、動作模式／肌群搜尋、廠區器材篩選與同模式替代動作。資料規則與來源見 `docs/exercises.md`。
- 手動建課表：待使用者定案基本單位是多日課表，還是每份獨立的單堂課表；兩者會影響資料模型與編輯流程。
- v0.1 剩下：手動建課表、訓練中紀錄、D1 同步（資料表要有 `user_id`）；依需求，在開始累積正式訓練紀錄前完成登入與同步。
- v0.2：器材被占用時推薦替代動作與重排（核心功能）

## 待處理

- PR 預覽建置失敗（見上表），需要使用者改 Cloudflare 的 Preview command
- PWA 加到主畫面：已加 `useCredentialsForManifestTag`，使用者尚未實測
- 刪除舊命名的已合併分支（`refactor/component-split`、`docs/*`、`feat/api-me`、`fix/access-login`）：雲端環境不允許刪除遠端分支，需要使用者在 GitHub 刪除

## 文件說明

- `docs/requirements.md` 的「登入與使用者」寫的是 Access 方案，**已由 auth-service 取代**（見 `docs/decisions.md`）
- `docs/auth-service.md` 是登入服務的早期設計，**以 `auth-service` repo 的 `docs/design.md` 為準**
