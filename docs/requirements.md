# RepRoute 需求與規劃

個人使用的健身課表 PWA。手機加到主畫面當 App 用，部署在自己的 Cloudflare 上。

## 核心概念

和市面上的 App（Fitbod、Hevy、Strong 等）最大的不同：**依健身房現場狀況動態重排**。
器材有人在用時，不只換掉單一動作，而是考慮整堂課剩下的順序、肌群疲勞與這間分館實際有的器材。

## 功能需求

| # | 功能 | 說明 | 階段 |
|---|---|---|---|
| F1 | 廠區器材清點 | 依器材主清單逐項記錄數量；啞鈴、壺鈴等記錄最重重量 | v0.1 |
| F2 | 動作資料庫 | 動作 ↔ 器材對應、動作模式、主要／次要肌群、替代動作 | v0.1 |
| F3 | 排課表 | 依使用者選擇（分化方式、目標、天數）與廠區器材產生課表 | v0.1（手動）／v0.4（自動） |
| F4 | 排動作順序 | 複合動作在前、孤立動作在後；大肌群先、小肌群後；可拖曳調整 | v0.1 |
| F5 | 器材被占用 | 一鍵「被占用」→ 推薦同模式、同肌群且此廠區做得到的替代動作，或把動作往後排並重排剩下的順序 | **v0.2（核心）** |
| F6 | 訓練紀錄 | 每組重量、次數、RIR／RPE | v0.1 |
| F7 | 建議重量 | 以 Epley 估 1RM：`1RM = w × (1 + reps / 30)`，搭配 RIR 漸進；沒有紀錄時用測試組冷啟動 | v0.3 |
| F8 | 熱量估算 | MET × 體重 × 時間的粗估，只當參考值 | v0.4 |
| F9 | 追蹤與建議 | 停滯偵測（例如連續 3 次沒進步）、deload 提醒、變化式輪替；之後可接 LLM 做訓練回顧 | v1.0 |
| F10 | 擁擠度紀錄（選配） | 每次自己記人多／人少，累積後建議各分館的離峰時段 | 之後 |

## 非功能需求

- **行動優先**：單手操作、大按鈕（最少 44px）、組間快速輸入
- **離線可用**：PWA，健身房收訊差也能用
- **個人資料不離開裝置**：v0.x 只存 IndexedDB；之後同步也只存在自己的 Cloudflare D1
- **私人存取**：用 Cloudflare Access 擋在前面，不自己寫登入
- **不依賴健身房的資料**：健身工廠沒有公開器材清單與即時狀態，全部自己清點

## 資料模型

```
Equipment（器材主清單，data/equipment-catalog.json）
  id, name, nameEn, category, hasWeightRange?

Gym（廠區，IndexedDB）
  id, name, inventory: { [equipmentId]: { count, maxWeightKg?, note? } }

Exercise（動作，待建）
  id, name, pattern（推／拉／蹲／髖鉸鏈／…）, primaryMuscles, secondaryMuscles
  equipment: string[][]   // 外層任一組成立即可，內層全部都要有
  alternatives: string[]

例：槓鈴臥推
  equipment: [["olympic-barbell", "flat-bench-press"], ["smith-machine", "flat-bench"]]
  alternatives: ["dumbbell-bench-press", "machine-chest-press", "push-up"]
```

器材主清單用「器材類型」而不是品牌型號，推薦邏輯只關心能做什麼動作。

## 架構

```
同一個 Cloudflare Worker
├── 靜態檔案：Quasar PWA（dist/pwa）
└── /api/*：Hono
      ├── D1：訓練紀錄、多裝置同步（之後）
      └── LLM 代理：API key 放 Workers Secrets（之後）
```

| 層 | 選擇 |
|---|---|
| 前端 | Quasar（Vue 3 + Vite + TypeScript），PWA 模式 |
| 狀態 | Pinia |
| 本機資料 | IndexedDB（Dexie.js） |
| 後端 | Hono on Cloudflare Workers |
| 資料庫 | Cloudflare D1（之後） |
| 存取控制 | Cloudflare Access |
| 套件管理 | pnpm |

## 開發階段

- **v0.1**：器材主清單 ✅、廠區清點 ✅、動作資料庫、手動建課表、訓練中紀錄
- **v0.2**：器材被占用 → 推薦替代動作與重排（核心差異點）
- **v0.3**：依歷史紀錄建議重量
- **v0.4**：自動排課表、熱量估算
- **v1.0**：停滯偵測、變化建議、多裝置同步（D1）、LLM 訓練回顧

## 注意事項

- 不使用健身房的 logo、官網照片；命名避免讓人誤以為是官方 App
- 不爬健身房會員 App 或網站（違反會員條款，也沒有需要的資料）
- 引用外部動作資料庫前先確認授權（例如 free-exercise-db 為 Unlicense；wger 資料為 CC-BY-SA）
