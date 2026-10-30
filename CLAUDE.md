# RepRoute

個人健身課表 PWA：依廠區器材排課，器材被占用時自動重排或推薦替代動作。Quasar（Vue 3 + TypeScript）前端 + Hono on Cloudflare Workers，pnpm。

**開始工作前先讀 `docs/STATUS.md`（目前進度與下一步）**；需求與規劃在 `docs/requirements.md`，已做的決定與原因在 `docs/decisions.md`。

## 與使用者合作

- 回覆用繁體中文（台灣用語）；程式碼註解用中文；commit 訊息用英文
- 使用者熟悉 Vue / Quasar，偏好小範圍 review：一個 commit 只做一件事，PR 說明列出建議的 review 順序
- **不直接 push 到 `main`**（有分支保護）：從最新的 `main` 開分支、發 PR，等使用者合併
- **分支命名**：一律 `feature-<簡短描述>`，英文小寫、用 `-` 連接，例如 `feature-exercise-db`。不要用 `feat/`、`docs/`、`fix/` 這類帶斜線的前綴
- **不要請使用者把 secret、私鑰、token 貼到對話**；機密由使用者直接設定到 Cloudflare。可以貼的：ID、網址、錯誤訊息、建置紀錄
- Cloudflare、Google Cloud、GitHub 設定頁只有使用者能操作；需要時給明確的點擊步驟
- 改變已記錄的決定前，先和使用者確認，並更新 `docs/decisions.md`
- 工作告一段落時更新 `docs/STATUS.md`

## 指令

```bash
pnpm install
pnpm dev            # 前端開發伺服器（PWA 模式，port 9200）
pnpm typecheck      # 前端 + Worker
pnpm lint:check
pnpm format:check
pnpm test           # Worker 的單元測試
pnpm build          # 打包到 dist/pwa
pnpm worker:dev     # 打包後用 Wrangler 跑前端 + /api（port 8787）
```

push 前 typecheck、lint、format、test、build 都要通過。改到畫面時，用 `pnpm worker:dev` 加瀏覽器實際操作一次。

## 程式慣例

- 前端分層（由上往下呼叫）：`pages/` 只組裝 → `components/`（common、layout、gym、inventory）→ `composables/` 狀態 → `utils/` 純函式、`db/` 資料存取
- **只有 `src/db/` 能碰 IndexedDB（Dexie）**；之後的 D1 同步也只改這一層
- composable 的狀態整個替換、不就地修改（`shallowRef`）；存進 IndexedDB 前要去掉 Vue proxy（見 `src/db/gyms.ts`）
- Worker 只處理 `/api/*`（`wrangler.jsonc` 的 `run_worker_first`），其他路徑是靜態檔
- Worker 的登入驗證是通用的 JWT 驗證（`worker/auth/`），由 `AUTH_*` 設定決定簽發者；設定缺漏時拒絕所有需要登入的請求
- PWA Service Worker 的 `navigateFallbackDenylist` 必須排除 `/api/` 與 `/cdn-cgi/`
- 安全相關的修改要有測試，並確認「把檢查拿掉時測試會失敗」
- 新增套件前確認仍在維護，版本選發布超過兩週的

## 相關系統

- `Ciren22007524/auth-service`：集中式登入服務 `auth.cirenjhong.com`，RepRoute 是第一個接入的服務（`client_id` = `reproute`）。接入方式見該 repo 的 `docs/design.md`「各服務如何接入」
