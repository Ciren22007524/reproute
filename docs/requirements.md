# RepRoute 需求與規劃

個人使用的健身課表 PWA。手機加到主畫面當 App 用，部署在自己的 Cloudflare 上。

## 核心概念

和市面上的 App（Fitbod、Hevy、Strong 等）最大的不同：**依健身房現場狀況動態重排**。
器材有人在用時，不只換掉單一動作，而是考慮整堂課剩下的順序、肌群疲勞與這間分館實際有的器材。

## 功能需求

| #   | 功能               | 說明                                                                                       | 階段                       |
| --- | ------------------ | ------------------------------------------------------------------------------------------ | -------------------------- |
| F1  | 廠區器材清點       | 依器材主清單逐項記錄數量；啞鈴、壺鈴等記錄最重重量                                         | v0.1                       |
| F2  | 動作資料庫         | 動作 ↔ 器材對應、動作模式、主要／次要肌群、替代動作                                        | v0.1                       |
| F3  | 排課表             | 依使用者選擇（分化方式、目標、天數）與廠區器材產生課表                                     | v0.1（手動）／v0.4（自動） |
| F4  | 排動作順序         | 複合動作在前、孤立動作在後；大肌群先、小肌群後；可拖曳調整                                 | v0.1                       |
| F5  | 器材被占用         | 一鍵「被占用」→ 推薦同模式、同肌群且此廠區做得到的替代動作，或把動作往後排並重排剩下的順序 | **v0.2（核心）**           |
| F6  | 訓練紀錄           | 每組重量、次數、RIR／RPE                                                                   | v0.1                       |
| F7  | 建議重量           | 以 Epley 估 1RM：`1RM = w × (1 + reps / 30)`，搭配 RIR 漸進；沒有紀錄時用測試組冷啟動      | v0.3                       |
| F8  | 熱量估算           | MET × 體重 × 時間的粗估，只當參考值                                                        | v0.4                       |
| F9  | 追蹤與建議         | 停滯偵測（例如連續 3 次沒進步）、deload 提醒、變化式輪替；之後可接 LLM 做訓練回顧          | v1.0                       |
| F10 | 擁擠度紀錄（選配） | 每次自己記人多／人少，累積後建議各分館的離峰時段                                           | 之後                       |
| F11 | 備份與同步         | 本機 IndexedDB 為主，有網路時同步到 Cloudflare D1；另提供 JSON 匯出／匯入                  | v0.1                       |
| F12 | 登入與使用者       | Google 登入（由 Cloudflare Access 處理）；每位使用者的資料彼此隔離                         | v0.1（與 D1 同步一起）     |

## 非功能需求

- **行動優先**：單手操作、大按鈕（最少 44px）、組間快速輸入
- **離線可用**：PWA，健身房收訊差也能用
- **資料不遺失**：本機與雲端各一份，清除瀏覽器資料或換手機都能還原
- **個人資料只放在自己的地方**：手機的 IndexedDB 與自己帳號下的 Cloudflare D1，不用第三方服務
- **私人存取**：用 Cloudflare Access 搭配 Google 登入擋在前面，不自己寫登入；只有白名單內的 Google 帳號能進入
- **資料隔離**：多位使用者時，每個人只看得到自己的資料（伺服器端強制，不靠前端）
- **不依賴健身房的資料**：健身工廠沒有公開器材清單與即時狀態，全部自己清點

## 資料模型

```
Equipment（器材主清單，data/equipment-catalog.json）
  id, name, nameEn, category, hasWeightRange?

User（使用者，來自 Cloudflare Access 的登入資訊，不另外存密碼）
  id     = Access JWT 的 sub（穩定的使用者 id；email 可能會變，不拿來當 id）
  email  = 顯示用

Gym（廠區，IndexedDB；同步到 D1 時加上 user_id）
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

## 資料儲存策略：IndexedDB + D1

採用 **local-first**：App 永遠讀寫本機的 IndexedDB，D1 只負責備份與多裝置同步。

|          | IndexedDB（Dexie）       | Cloudflare D1                                                 |
| -------- | ------------------------ | ------------------------------------------------------------- |
| 角色     | 主要資料庫，App 直接讀寫 | 雲端備份、多裝置同步                                          |
| 位置     | 手機／電腦的瀏覽器       | 自己帳號下的 Cloudflare                                       |
| 離線     | 可用                     | 不可用                                                        |
| 存取方式 | 前端直接存取             | 透過 Hono `/api/sync`                                         |
| 費用     | 免費                     | 免費方案（5 GB、每天讀 500 萬列／寫 10 萬列），個人用不會超過 |

**為什麼兩個都要**

- 只用 IndexedDB：清除瀏覽器資料、換手機時資料就沒了；iOS Safari 也可能清掉不常開網站的資料
- 只用 D1：健身房收訊差時無法紀錄，每次操作都要等網路

**同步規則**

- 每筆資料都有 `id`（UUID，前端產生）、`updatedAt`，刪除改成標記 `deletedAt`（軟刪除），刪除動作才能同步到其他裝置
- **推送**：上次同步後有變動的資料送到 `/api/sync`
- **拉取**：取回伺服器上比本機游標更新的資料
- **衝突**：以 `updatedAt` 較新的為準（last-write-wins）。資料依使用者隔離，同一個人同時在兩台裝置改同一筆的機會很低
- **觸發時機**：打開 App、結束一次訓練、網路從離線恢復時、手動按「立即同步」
- **驗證與歸屬**：見下一節「登入與使用者」。`/api/sync` 只接受已驗證的使用者，並只讀寫該使用者的資料

**過渡方案**：D1 同步完成前，先提供 JSON 匯出／匯入當手動備份（廠區清點頁目前已有匯出）。

**D1 資料表（規劃）**

所有使用者資料表都有 `user_id`，並建立 `(user_id, updated_at)` 索引；每個查詢都必須帶 `WHERE user_id = ?`。

```
users(id TEXT PK, email, created_at, last_seen_at)
gyms(id TEXT PK, user_id, name, inventory JSON, created_at, updated_at, deleted_at)
exercises_custom(...)      // 自訂動作；內建動作資料放在 data/ 不需同步
plans(...)                 // 課表
workouts(...)              // 每次訓練
workout_sets(...)          // 每組重量、次數、RIR
```

## 登入與使用者

### 階段 1：Cloudflare Access + Google 登入（現在採用）

不自己寫登入系統。Access 負責 Google 登入與白名單，Worker 從 Access 取得已驗證的使用者身分。

```
使用者 → Google 登入（Access）→ Access 在每個請求帶上簽章過的 JWT
       → Hono 驗證 JWT → 取得 sub、email → 依 user_id 讀寫 D1
```

**Cloudflare 設定（手動，在 Zero Trust 後台）**

1. Settings → Authentication → Login methods：新增 **Google**（需在 Google Cloud Console 建立 OAuth 用戶端）
2. reproute 的 Access 應用程式 → Login methods：只勾 **Google**，取消 One-time PIN，開啟 Instant Auth
3. Policy `only-me`：Include → Emails 列出允許的帳號；Require → Login Methods → Google
4. 開放給其他人時，只要把對方的 Gmail 加進 Include

**Worker（Hono）**

- 每個 `/api/*` 請求驗證 `Cf-Access-Jwt-Assertion`：用 Access 團隊網域的公開金鑰（`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`）檢查簽章、`aud`（應用程式的 AUD tag）與到期時間
- **只信任驗證過的 JWT**，不直接相信 `Cf-Access-Authenticated-User-Email` 等標頭
- 團隊網域與 AUD tag 放在 Worker 的環境變數（不是機密，但每個環境不同）
- `GET /api/me`：回傳 `{ id, email }`；第一次看到這個使用者時寫入 `users`
- 驗證失敗一律回 401

**前端**

- 啟動時呼叫 `/api/me`，把結果存在本機；離線時使用上次的身分
- **本機資料依使用者分開**：IndexedDB 資料庫名稱加上使用者 id（例如 `reproute-<id>`），同一台裝置換帳號不會混到資料
- 現有的本機資料（還沒有使用者時建立的）在第一次登入後歸給該使用者

**限制**

- Access 免費方案最多 50 位使用者
- 只能邀請（白名單），不能讓陌生人自己註冊
- 做成原生 App（Capacitor）時，Access 的瀏覽器登入流程不適用

### 階段 2：App 自己處理 Google OAuth（公開註冊時才做）

需要開放註冊、超過 50 人或上架原生 App 時，改由 Hono 處理 Google OAuth 與 session（使用現成套件，例如 Hono 的 OAuth 套件或 Better Auth），Access 只保留給預覽網址。資料表已經有 `user_id`，不需要搬資料；`users.id` 改成自己產生的 id，並記錄對應的 Google 帳號。

## 架構

```
同一個 Cloudflare Worker
├── 靜態檔案：Quasar PWA（dist/pwa）
└── /api/*：Hono
      ├── 驗證 Access JWT → 使用者身分
      ├── /api/me：目前登入的使用者
      ├── /api/sync ↔ D1：備份、多裝置同步（依 user_id 隔離）
      └── LLM 代理：API key 放 Workers Secrets（之後）
```

| 層                     | 選擇                                          |
| ---------------------- | --------------------------------------------- |
| 前端                   | Quasar（Vue 3 + Vite + TypeScript），PWA 模式 |
| 狀態                   | Pinia                                         |
| 本機資料（主要）       | IndexedDB（Dexie.js）                         |
| 後端                   | Hono on Cloudflare Workers                    |
| 雲端資料（備份／同步） | Cloudflare D1                                 |
| 存取控制               | Cloudflare Access（Google 登入）              |
| 套件管理               | pnpm                                          |

## 開發階段

- **v0.1**：器材主清單 ✅、廠區清點 ✅、JSON 匯出／匯入、動作資料庫、手動建課表、訓練中紀錄、**Google 登入（Access）+ `/api/me` + D1 同步**（開始累積真正的訓練紀錄前完成）
- **v0.2**：器材被占用 → 推薦替代動作與重排（核心差異點）
- **v0.3**：依歷史紀錄建議重量
- **v0.4**：自動排課表、熱量估算
- **v1.0**：停滯偵測、變化建議、LLM 訓練回顧
- **之後（公開註冊時）**：登入改為 App 自己處理 Google OAuth（見「登入與使用者」階段 2）

## 注意事項

- 不使用健身房的 logo、官網照片；命名避免讓人誤以為是官方 App
- 不爬健身房會員 App 或網站（違反會員條款，也沒有需要的資料）
- 引用外部動作資料庫前先確認授權（例如 free-exercise-db 為 Unlicense；wger 資料為 CC-BY-SA）
