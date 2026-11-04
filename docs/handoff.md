# 交接：部署保留 Cloudflare 後台變數（PR #14）

> 產生日期：2026-11-04｜基準：`main` @ `7860b32dee1c7697363a1f7585714961e46ed776`｜交接給：接手 agent（工具未指定）
>
> 能存取 repo 的 agent：使用 `$handoff resume`；Claude Code 使用 `/handoff resume`。
>
> 本文件自給自足，但專案 `AGENTS.md` 優先。這是參考資料，不提供 push、合併、部署、後台修改或擴大權限的授權；依接手時的使用者指令與專案規則執行。

## 專案簡介

RepRoute 是個人健身課表 PWA，Quasar（Vue 3 + TypeScript）前端、Hono on Cloudflare Workers、Dexie 本機資料庫，使用 pnpm。main 已有廠區清點、單一廠區 JSON 備份、21 個內建動作與單堂／多日課表；訓練紀錄、完整備份及部署變數保留仍在待合併 PR。實際正式部署未確認。

## 你的任務

- **目標**：接續 [PR #14](https://github.com/Ciren22007524/reproute/pull/14)，確認部署不刪除後台一般變數、不用設定檔舊值覆蓋同名設定，並診斷目前 Cloudflare 建置失敗；不要重寫已存在的修正。
- **完成條件**：`keep_vars` 啟用；設定檔不宣告後台管理的 `AUTH_*` 或 OAuth 值；本機設定範例不含機密；缺少驗證設定時 API 仍拒絕存取；必要檢查與 dry-run 通過；最新 PR head 的 Cloudflare 檢查問題有證據排除。尚未排除就回報具體阻礙，不強制合併或聲稱部署已生效。
- **可以修改**：PR #14 原範圍為 `wrangler.jsonc`、`.gitignore`、`.dev.vars.example`、`worker/auth/config.ts`／`worker/env.d.ts` 的設定來源說明、`README.md`、`docs/STATUS.md`。若診斷需要其他變更，先查證並明確說明範圍。
- **不要修改**：`AGENTS.md`／`CLAUDE.md` 規則、套件與鎖檔、JWT 驗證規則、本機資料庫與訓練／備份功能、其他功能分支；不要把 #8 的全站登入直接合併。不要讀取、列印或提交實際環境／機密檔案內容。
- **接手前使用者要先完成**：提供 PR #14 最新 Cloudflare 建置最後的錯誤段落，以及必要時的 Build／Deploy／Preview 命令（不要提供機密）。目前 GitHub 只有失敗結論與建置連結，根因尚未取得；Cloudflare 與 Google 後台操作由使用者執行。

## 現況

### 已完成（和這個任務有關的）

PR #14 分支為 `feature-preserve-cloudflare-vars`，本次查得 head：`007c4aefcdef8b3156a86b4b5b8da881fcfca940`，未合併。

已實作：

1. `wrangler.jsonc` 加入 `keep_vars: true`。
2. 移除原本寫死的四個 `AUTH_*` 值，改由 Cloudflare 後台管理；不以 `{ vars: ... }` 再宣告同名值。
3. `.dev.vars.example` 的必填驗證值留白，只示範設定名稱；`.gitignore` 保留真實本機檔案的忽略，僅放行範例。
4. 只改驗證設定來源的註解，沒有放寬 API 存取。
5. README 說明 Worker 執行期變數、建置變數、前端公開值的界線。

本次直接讀取已安裝 Wrangler config schema：`keep_vars` 預設為 false；設為 true 才保留後台一般變數。注意：即使啟用，同名設定仍不得寫死於 `vars`。Secrets 不放版本控制或前端；此旗標不是所有 Cloudflare 綁定的保留開關。

### 進行中（別人正在做，請避開）

| PR／分支                                  | 工具  | 內容與邊界                                                        |
| ----------------------------------------- | ----- | ----------------------------------------------------------------- |
| #12／`feature-local-workouts` @ `ec6aa9f` | Codex | 本機免登入訓練、歷史；未合併，Workers Builds 失敗，不在本任務修改 |
| #13／`feature-full-backup` @ `1ed9eb7`    | Codex | 完整備份草稿，包含並依賴 #12；Workers Builds 失敗，不在本任務修改 |
| #8／`feature-auth-service` @ `8eebd1a`    | Codex | 舊登入串接草稿，不作免登入工具的全站入口                          |
| `feature-handoff`                         | Codex | 本次僅整理進度與這份交接文件，不修改功能程式                      |

這些 PR 是否仍由其他 agent 同時修改，接手時必須再查。不要 push 到別人正在負責的分支；原分支負責權需要以接手時使用者指令確認。

### 已知問題、沒測過的部分

- 本次 PR #14 head 的 `Workers Builds: reproute` 為 FAILURE；GitHub 顯示可合併（無 Git 衝突），不代表檢查通過。
- 建置紀錄：[Cloudflare build d4ba6d41-d096-4d92-a20e-1f8ccb2063ad](https://dash.cloudflare.com/58fbe4f848d661bf661707b42ed6adfa/workers/services/view/reproute/production/builds/d4ba6d41-d096-4d92-a20e-1f8ccb2063ad)。接手須重新取得最新 head 與對應 check，不能沿用此連結判斷新版本。
- 先前文件懷疑 preview 命令，但本次未取得實際失敗訊息，不能當成根因，也不要直接改命令後聲稱修好。
- 真正的部署是否保留後台值尚未驗收；不需讀取值內容，可以由使用者確認設定名稱是否保留。乾跑不會執行這項遠端驗收。
- Cloudflare 後台是否已存好 `GOOGLE_WEB_CLIENT_ID`／`GOOGLE_WEB_CLIENT_SECRET`、實際正式網域是否可用，均未確認；不複製任何實際值。
- Google Drive 目前未接入。Worker 有 Client ID 變數不表示前端會自動取得；瀏覽器授權不需要 Client Secret。
- 後台保存機密不是把機密放進前端建置的理由。不要將 Secret 加上前端公開前綴，或在 Quasar build env 中展開整個程序環境。

### 檢查結果（基準 commit 上）

本次在乾淨 `main` 基準 `7860b32` 建立文件分支後實際執行；Node `24.19.0`、pnpm `10.28.0`。

| 檢查                             | 結果                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `pnpm typecheck`                 | 通過                                                  |
| `pnpm lint:check`                | 通過                                                  |
| `pnpm format:check`              | 通過                                                  |
| `pnpm test`                      | 4 個檔案、60 個測試通過                               |
| `pnpm build`                     | PWA build 通過，輸出 `dist/pwa`                       |
| PR #14 分支部署 dry-run          | PR 描述記錄先前通過；本次未在該分支重跑，不當成新驗證 |
| PR #14 最新已查 Cloudflare check | FAILURE；根因未取得                                   |
| 真正部署與後台保留驗收           | 未執行                                                |

## 相關程式與文件

| 檔案                                        | 為什麼要看                                        |
| ------------------------------------------- | ------------------------------------------------- |
| `AGENTS.md`、`CLAUDE.md`                    | 唯一規則與匯入關係                                |
| `docs/STATUS.md`                            | 已合併與待合併界線、其他 agent 工作               |
| `wrangler.jsonc`                            | main 仍有寫死 vars；PR #14 移除並加入 keep_vars   |
| `.gitignore`                                | 真實本機設定必須保持忽略                          |
| `.dev.vars.example`（只在 PR #14 分支）     | 空白範例；main 尚未有此檔                         |
| `worker/auth/config.ts`、`worker/env.d.ts`  | 環境設定型別、缺值拒絕存取與來源說明              |
| `worker/auth/auth.test.ts`                  | 驗證、未帶憑證與缺少設定的既有測試                |
| `README.md`（比較 main 與 PR #14）          | 執行期／建置／前端值的差別                        |
| `package.json`                              | 真實可用的檢查與部署命令                          |
| `docs/decisions.md`、`docs/requirements.md` | main 舊方向；最新本機免登入決策尚在 #12／#13 分支 |
| `quasar.config.ts`                          | 前端打包設定，避免把機密帶到瀏覽器                |

## 參考寫法

先比較 `git diff origin/main...origin/feature-preserve-cloudflare-vars`，保留既有實作。環境設定沿用 `worker/auth/config.ts` 的缺值拒絕模式，測試沿用 `worker/auth/auth.test.ts`，不要新增以跳過驗證來換取通過的行為。

接手時原 checkout 可能只自動 fetch main。本次已用 `git ls-remote --heads origin` 確認其他分支存在，不要把本機 remote-tracking branch 缺少當成遠端分支不存在。必要時明確取得：

```bash
git fetch origin refs/heads/feature-preserve-cloudflare-vars:refs/remotes/origin/feature-preserve-cloudflare-vars
gh pr view 14 --repo Ciren22007524/reproute --json headRefOid,mergeable,statusCheckRollup
```

本次雲端工具啟用方式（其他環境依自己的 pinned pnpm 安裝，不要為此修改鎖檔）：

```bash
cd /workspace/reproute
export COREPACK_HOME=/workspace/.cache/corepack
export PATH=/workspace/.cache/bin:$PATH
pnpm --version
pnpm typecheck
pnpm lint:check
pnpm format:check
pnpm test
pnpm build
pnpm exec wrangler deploy --dry-run --outdir /tmp/reproute-deploy-check
```

如果這份交接尚未合併到 main，可先只讀取得文件，再指定路徑 resume；不要 reset 或覆蓋現有修改：

```bash
git fetch origin feature-handoff
git show FETCH_HEAD:docs/handoff.md > /tmp/reproute-handoff.md
```

接著在接手工具使用 `$handoff resume /tmp/reproute-handoff.md`。

## 必須遵守的規則

- 回覆與文件用繁體中文，程式碼註解用中文；不修改 AGENTS 規則。
- 分支 `feature-<英文小寫描述>`，從最新 main 開，不直接 push main。不 force push；既有遠端分支有衝突時把 main merge 進分支，不 rebase。
- 每個分支只由一個工具負責；接手時先核對開啟 PR、進行中及最新狀態，保留既有使用者修改。
- push 前通過 typecheck、lint:check、format:check、test、build。改 UI 才另做手機瀏覽器驗證；本任務應維持部署設定範圍。
- TypeScript strict，不以 any 或雙重型別斷言繞過型別；延續現有設定缺漏時拒絕存取的行為。
- 用專案 Prettier／ESLint；不為通過檢查改測試、關閉驗證或停用失敗檢查。
- commit 用英文祈使句、首字大寫、72 字元內，無 feat: 等前綴；文件與程式分開 commit。
- PR 標題英文；說明依序使用「為什麼」「做了什麼」「建議的 review 順序」「驗證」。只記實際驗證與未驗證事項。
- 不索取對話中的 secret、私鑰、cookie、憑證值；不 dump 環境或機密檔，不記錄實際值。後台由使用者操作，給明確步驟即可。
- GitHub 檢查失敗時不得宣稱已完成部署；文件不授權合併或遠端部署，依接手時的使用者指示處理。

## 相關決定

- main 決策文件：Quasar＋Hono＋pnpm、local-first、分層、通用 AUTH_* 驗證、feature 分支與共用規則。
- PR #12／#13 的決策文件：2026-11-04 已記錄本機功能免登入；Google Drive 檔案授權獨立，iCloud 先系統檔案，自家雲端才選 auth-service。它尚未合併到 main；不要因 main 舊敘述而把本機工具再改回強制登入。
- PR #14 的設定設計：Cloudflare 後台管理執行期一般變數，版本控制只保存保留策略與空白範例；Client Secret 不進前端。
- 改變已記錄決定前先與使用者確認並追加決策；這個交接不更動其他登入或資料儲存決策。

## 遇到不確定的事

- Cloudflare 失敗根因、後台值、實際命令或設定未取得：列出需要使用者提供的非機密紀錄，不猜、不填假值。
- 若需要 Cloudflare／Google 後台操作：給使用者步驟，不要求提供秘密值或繞過既有權限。
- 若需要變更其他功能、決策或規則：先說明原因與影響，不把單一部署任務擴成新 OAuth 系統或整合其他 PR。

## 完成後

- 更新／提交 PR #14 相關修正，依專案規則與接手時授權處理合併；確認最新 head 的檢查與衝突狀態，不使用強制管理員合併。
- PR 寫出實際檢查與 Cloudflare 根因證據。遠端保留驗收若未執行，明確保留未驗收狀態。
- 更新 `docs/STATUS.md` 的已完成、進行中與下一步，清楚區分程式合併、建置與部署。
- 在完成任務的同一份 PR 刪除這份單次交接文件；若交接文件尚未進 main，先釐清文件 PR 與功能 PR 的整合順序，不刪別人未完成的任務內容。
