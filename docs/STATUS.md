# RepRoute 進度與交接

> 更新：2026-11-03。每次工作告一段落時更新這份文件；新的 session 先讀這份和 `AGENTS.md`（Claude Code 與 Codex 共用的規則）。

**現況：已部署，只有「廠區器材清點」可以用。** 下一步是改用自己的登入服務（`auth-service`），之後才回到功能開發。

## 進行中

開始工作時加一列，合併前移除，避免 Claude Code 與 Codex 同時做同一件事（規則見 `AGENTS.md`「多個 AI 工具一起開發」）。

| 分支                 | 工具  | 在做什麼                                          |
| -------------------- | ----- | ------------------------------------------------- |
| feature-auth-service | Codex | auth-service 前後端串接與安全測試；待正式網域驗收 |

## 部署狀態

| 項目            | 狀態                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 正式網址        | `https://reproute.ciren22007524.workers.dev`                                                                                             |
| 自動部署        | Cloudflare Workers Builds 連接本 repo，合併到 `main` 就部署                                                                              |
| 登入            | Cloudflare Access（Google 登入，Scope All traffic，policy `only-me`）                                                                    |
| `main` 分支保護 | 需要 PR、禁止 force push 與刪除、approvals 0                                                                                             |
| PR 預覽建置     | **一直失敗**，與程式無關；推測是 Preview command `npx wrangler preview`（beta），建議使用者改成 `npx wrangler versions upload`，尚未處理 |
| 開發環境        | `.devcontainer/` 支援 GitHub Codespaces                                                                                                  |

## 已完成

| 項目       | 說明                                                                                  | 位置                                              |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 專案骨架   | Quasar PWA + Hono Worker；ESLint、Prettier、Vitest                                    | —                                                 |
| 器材主清單 | 72 項，7 個分類                                                                       | `data/equipment-catalog.json`                     |
| 廠區清點   | 新增廠區、逐項記數量、啞鈴等記最重重量、搜尋、只顯示已勾選、匯出 JSON；存在 IndexedDB | `src/pages/Gym*.vue`、`src/components/inventory/` |
| 登入驗證   | Worker 驗證 Access 的 JWT（簽章、iss、aud、exp），`GET /api/me`；14 個測試            | `worker/auth/`、`worker/app.ts`                   |
| 帳號選單   | 右上角顯示登入的 email 與狀態                                                         | `src/components/layout/AccountMenu.vue`           |
| 其他分頁   | 今日訓練、課表、紀錄目前只有預告畫面                                                  | `src/pages/`                                      |

## 下一步

### 1. auth-service 串接待審查與正式驗收

`feature-auth-service` 已實作瀏覽器登入、state callback、記憶體 token、續期、Bearer API 與登出。Worker 改驗證 auth-service 的 ES256 JWT，要求必要 claims；設定指向 `/jwks`。

使用者已授權 Codex 在必要檢查通過後建立並合併自己負責的 PR（見 `docs/decisions.md`）。目前 GitHub API 因環境白名單缺少 `api.github.com` 遭拒；已將網域加入環境設定草稿，待使用者儲存並發布生效。

本機 typecheck、lint、format、47 個測試與 PWA build 通過；Chromium 手機尺寸模擬登入／登出／callback 通過，8 項安全檢查已做故意改壞驗證。

詳細切換步驟與限制見 `docs/auth-integration.md`。正式站仍需使用者設定 `reproute.cirenjhong.com`、確認 auth-service 動態端點防護與 D1／Google 設定，再移除 RepRoute 正式站的 Access。尚未完成真實 Google 登入驗收，部署狀態表仍記錄最後已知狀態。

### 2. 之後的功能（依 `docs/requirements.md` 開發階段）

- v0.1 剩下：JSON 匯入、動作資料庫、手動建課表、訓練中紀錄、D1 同步（資料表要有 `user_id`）
- v0.2：器材被占用時推薦替代動作與重排（核心功能）

## 待處理

- PR 預覽建置失敗（見上表），需要使用者改 Cloudflare 的 Preview command
- PWA 加到主畫面：已加 `useCredentialsForManifestTag`，使用者尚未實測
- 刪除舊命名的已合併分支（`refactor/component-split`、`docs/*`、`feat/api-me`、`fix/access-login`）：雲端環境不允許刪除遠端分支，需要使用者在 GitHub 刪除

## 文件說明

- `docs/requirements.md` 的「登入與使用者」寫的是 Access 方案，**已由 auth-service 取代**（見 `docs/decisions.md`）
- `docs/auth-service.md` 是登入服務的早期設計，**以 `auth-service` repo 的 `docs/design.md` 為準**
