# RepRoute 進度與交接

> 更新：2026-10-30。每次工作告一段落時更新這份文件；新的 session 先讀這份和 `CLAUDE.md`。

**現況：已部署，只有「廠區器材清點」可以用。** 下一步是改用自己的登入服務（`auth-service`），之後才回到功能開發。

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

### 1. 改用 auth-service 登入（等 auth-service 部署完成）

auth-service 還在等使用者完成 Google OAuth 與 Cloudflare 設定，進度見 `Ciren22007524/auth-service` 的 `docs/STATUS.md`。部署後 RepRoute 要做：

1. 網址搬到 `reproute.cirenjhong.com`（refresh cookie 是 `SameSite=Lax`，必須同站）
2. `wrangler.jsonc` 的 `AUTH_*` 改成 auth-service：issuer / JWKS 指向 `https://auth.cirenjhong.com`，`AUTH_AUDIENCE=reproute`，`AUTH_TOKEN_HEADER=Authorization`
3. 前端：啟動時 `POST /token` 換 access token；401 時導到 `/authorize`；新增 `/auth/callback` 頁；API 帶 `Authorization: Bearer`；access token 只放記憶體
4. `useCurrentUser` 改用新流程；登出呼叫 auth-service 的 `/logout`
5. 正式站移除 Cloudflare Access（預覽網址可保留）

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
