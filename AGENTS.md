# RepRoute

個人健身課表 PWA：依廠區器材排課，器材被占用時自動重排或推薦替代動作。Quasar（Vue 3 + TypeScript）前端 + Hono on Cloudflare Workers，pnpm。

這份是 **Claude Code 與 Codex 共用的唯一規則來源**。`CLAUDE.md` 只匯入這份文件；要改規則就改這裡，不要在 `CLAUDE.md` 另外加規則，兩邊才不會不一致。

**規則由 Claude Code 維護**：Codex 不自行修改這份文件；覺得規則需要調整時，在 PR 的「為什麼」提出，由使用者決定。兩個工具的產出要一致到看不出是誰寫的。

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

## 多個 AI 工具一起開發

Claude Code 與 Codex 會在同一個 repo 工作：

- 開始前先 `git fetch`，從最新的 `main` 開分支；看一下 `docs/STATUS.md` 的「進行中」、還開著的 PR 和 `feature-*` 分支，避免兩邊同時改同一批檔案
- 開始時在 `docs/STATUS.md` 的「進行中」加一列（分支、哪個工具、在做什麼），跟第一個 commit 一起推；合併前移除那一列
- 一個分支只由一個工具負責；不要 push 到另一個工具開的分支，除非使用者要求
- 分支和 `main` 衝突時，把 `main` merge 進分支解決；不要 rebase 或 force push 已經推上去的分支
- 交接靠 `docs/STATUS.md`：做完一段就更新，下一個工具才知道進度
- commit 結尾可以加各工具自己的 `Co-Authored-By` 署名；其他格式依本文件

## 指令

```bash
pnpm install
pnpm dev            # 前端開發伺服器（PWA 模式，port 9200）
pnpm typecheck      # 前端 + Worker
pnpm lint:check
pnpm format:check
pnpm test           # 單元測試（Vitest，目前是 Worker）
pnpm build          # 打包到 dist/pwa
pnpm worker:dev     # 打包後用 Wrangler 跑前端 + /api（port 8787）
```

push 前 typecheck、lint、format、test、build 都要通過。改到畫面時，用 `pnpm worker:dev` 加瀏覽器（手機尺寸）實際操作一次，並寫進 PR 的「驗證」。

## 程式慣例

**分層**（由上往下呼叫，下層不認識上層）

- `src/pages/`：只負責組裝組件與 composable，不寫商業邏輯
- `src/components/`：依領域分資料夾（`common/`、`layout/`、`gym/`、`inventory/`），只負責顯示與發出事件
- `src/composables/`：頁面狀態與操作；`src/utils/`：純函式；`src/db/`：資料存取
- **只有 `src/db/` 能碰 IndexedDB（Dexie）**；之後的 D1 同步也只改這一層
- 前端與 Worker 共用的型別放 `shared/`

**狀態與資料**

- composable 的狀態整個替換、不就地修改（`shallowRef`）；存進 IndexedDB 前要去掉 Vue proxy（見 `src/db/gyms.ts`）
- Worker 只處理 `/api/*`（`wrangler.jsonc` 的 `run_worker_first`），其他路徑是靜態檔
- Worker 的登入驗證是通用的 JWT 驗證（`worker/auth/`），由 `AUTH_*` 設定決定簽發者；**設定缺漏時拒絕所有需要登入的請求（fail closed）**
- PWA Service Worker 的 `navigateFallbackDenylist` 必須排除 `/api/` 與 `/cdn-cgi/`
- 安全相關的修改要有測試，並確認「把檢查拿掉時測試會失敗」
- 新增套件前確認仍在維護（npm 沒標 deprecated），版本選發布超過兩週的

## 程式風格

格式交給工具：Prettier（單引號、每行 100 字、2 空格）與 ESLint（`typescript-eslint` type-checked、`eslint-plugin-vue`）。改完執行 `pnpm format`、`pnpm lint`，不要手動調整格式。其他慣例照現有程式：

**TypeScript**

- 前端 `tsconfig` 是 strict，並開了 `noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`；不要為了繞過型別用 `any` 或 `as unknown as`（測試的假物件除外）
- 只用到型別的 import 寫 `import type`
- 檔名：Vue 組件 PascalCase（`EquipmentRow.vue`）；composable `useXxx.ts`；utils、db 用 camelCase（`exportGym.ts`、`gyms.ts`）；Worker 用小寫（`middleware.ts`）
- 函式、變數 camelCase；常數 `UPPER_SNAKE_CASE`

**Vue SFC**

- `<template>` 在前、`<script setup lang="ts">` 在後
- props 用 `defineProps<{ … }>()`；v-model 用 `defineModel`；emits 用具名 tuple：`defineEmits<{ 'update:count': [count: number] }>()`
- 畫面用 Quasar 元件（`q-btn`、`q-list`…），不自己刻一般 HTML 元件
- 健身房現場單手操作：可點擊的元素至少 44px（`tap-target` class）；只有圖示的按鈕要有中文 `aria-label`

**註解**

- 每個檔案開頭寫中文說明這個檔案做什麼（`.ts` 用 `/** */`，`.vue` 用 `<!-- -->`）
- 匯出的函式、介面欄位、props、emits 用 `/** */` 寫中文說明
- 行內註解說明「為什麼」，不重複程式碼在做什麼
- 中文用全形標點（，、：（））

**錯誤與 log**

- 畫面上的訊息用繁體中文，只講一般性原因與怎麼處理（`$q.notify({ type: 'negative', message: '匯出失敗，瀏覽器可能封鎖了下載' })`）
- Worker JSON API 的錯誤碼用英文 snake_case（`{ error: 'unauthorized' }`）
- `console.warn` / `console.error` 用英文短句加資料（`console.warn('Rejected token:', error.message)`）；不寫 token、cookie、密鑰

**測試**

- Vitest，測試檔放在原始碼旁邊（`*.test.ts`）
- Worker 的測試用 `createApp()` 注入本機金鑰（見 `worker/auth/auth.test.ts`），不打真的網路
- `describe` 依端點或功能分組；`it` 用中文描述情境與預期結果，例如 `it('沒有 token 時回 401', ...)`

## Commit 與 PR

**Commit 訊息**（英文）

- 標題用祈使句、首字大寫、不加句號，72 字元內：`Add gym repository and JSON export helper`
- 不用 `feat:`、`fix:` 這類前綴
- 需要時空一行寫內文，說明為什麼改、有什麼影響，每行 72 字元內換行
- 文件更新和程式分開 commit
- 解衝突用 merge commit：`Merge main into <branch>`，內文寫怎麼解的

**PR**

- 標題英文，風格同 commit 標題
- 內文中文，依序使用這些段落：

```markdown
## 為什麼

## 做了什麼

## 建議的 review 順序

## 驗證
```

- 「驗證」寫實際跑過的檢查與結果；改到畫面時寫瀏覽器實測了什麼；安全相關的修改要寫「故意改壞」驗證了哪些測試會失敗

## 文件

- 文件用繁體中文，常用表格整理；檔案、指令、設定名稱用 `code` 標記
- `docs/decisions.md` 只新增不刪除：推翻舊決定時新增一筆，說明原因

## 相關系統

- `Ciren22007524/auth-service`：集中式登入服務 `auth.cirenjhong.com`，RepRoute 是第一個接入的服務（`client_id` = `reproute`）。接入方式見該 repo 的 `docs/design.md`「各服務如何接入」
