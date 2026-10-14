# RepRoute

個人健身課表 PWA：依廠區器材排課，器材被占用時自動重排或推薦替代動作。

需求與規劃見 [docs/requirements.md](docs/requirements.md)。

## 技術棧

Quasar（Vue 3 + TypeScript）PWA ・ Dexie（IndexedDB）・ Hono on Cloudflare Workers ・ pnpm

## 開發

```bash
pnpm install
pnpm dev          # 前端開發伺服器（Quasar，PWA 模式）
pnpm typecheck    # 前端 + Worker 型別檢查
pnpm worker:dev   # 打包後用 Wrangler 在本機跑完整的 Worker（前端 + /api）
```

## 部署到 Cloudflare

```bash
pnpm wrangler login
pnpm deploy       # quasar build + wrangler deploy
```

部署後建議在 Cloudflare Zero Trust 為網域加上 **Access** 應用程式，只允許自己的 email 登入。

## 專案結構

```
src/            Quasar 前端
src-pwa/        PWA manifest 與 Service Worker 設定
worker/         Hono API（/api/*）
data/           器材主清單等靜態資料
docs/           需求文件
wrangler.jsonc  Cloudflare Worker 設定（靜態檔 + API）
```

## License

[MIT](LICENSE)
