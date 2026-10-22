# RepRoute

個人健身課表 PWA：依廠區器材排課，器材被占用時自動重排或推薦替代動作。

需求與規劃見 [docs/requirements.md](docs/requirements.md)。

## 技術棧

Quasar（Vue 3 + TypeScript）PWA ・ Hono on Cloudflare Workers ・ pnpm

資料採 local-first：IndexedDB（Dexie）為主要資料庫，有網路時同步到 Cloudflare D1 備份。

## 開發

### 用 GitHub Codespaces（建議）

在 GitHub 的 repo 頁面按 **Code → Codespaces → Create codespace on main**。
`.devcontainer/` 會自動裝好 Node 22、pnpm、所有套件和建議的擴充套件，完成後在終端機執行 `pnpm dev`，瀏覽器會自動開啟預覽。

### 指令

```bash
pnpm install
pnpm dev            # 前端開發伺服器（Quasar，PWA 模式，port 9200）
pnpm typecheck      # 前端 + Worker 型別檢查
pnpm lint           # ESLint 檢查並自動修正
pnpm format         # Prettier 排版所有檔案
pnpm worker:dev     # 打包後用 Wrangler 在本機跑完整的 Worker（前端 + /api，port 8787）
```

VS Code 存檔時會自動用 Prettier 排版；ESLint 的修正可用「Fix all auto-fixable problems」。

## 部署到 Cloudflare

```bash
pnpm wrangler login
pnpm deploy       # quasar build + wrangler deploy
```

部署後建議在 Cloudflare Zero Trust 為網域加上 **Access** 應用程式，只允許自己的 email 登入。

## 專案結構

```
.devcontainer/  Codespaces 開發環境設定
src/            Quasar 前端
src-pwa/        PWA manifest 與 Service Worker 設定
worker/         Hono API（/api/*）
data/           器材主清單等靜態資料
docs/           需求文件
wrangler.jsonc  Cloudflare Worker 設定（靜態檔 + API）
```

## License

[MIT](LICENSE)
