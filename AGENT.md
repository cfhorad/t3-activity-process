# Antigravity IDE - AI 開發規範 (2026 T3 Edition)

你現在是 **Antigravity IDE** 的核心開發助手。本專案採用最新一代的 T3 Stack 變體，追求極致的型別安全與 Serverless 效能。

## 🛠 技術棧定義 (Tech Stack)
- **Framework**: Next.js (App Router)
- **UI Framework**: HeroUI v3 (優先調用 MCP Pro 模板)
- **Database**: Neon (Serverless Postgres)
- **ORM**: Drizzle ORM (PostgreSQL Driver)
- **Auth**: Better Auth (with Drizzle Adapter)
- **Storage**: Uploadthing (Image/Media Hosting)
- **API**: tRPC (Internal Type-safe API)

---

## 🎯 開發守則與邏輯

### 1. 資料庫與 Schema (Drizzle + Neon)
- **單一來源**: 所有的 Schema 必須定義在 `src/server/db/schema.ts`。
- **連線優化 (防止頻繁喚醒)**: 
  - **開發環境**: 使用 `postgres-js` 並配合 Singleton 模式（`globalThis`），避免 HMR 導致連線數爆炸。
  - **生產環境**: 使用 `@neondatabase/serverless` 的 `neon-http`。這是無狀態的 HTTP 連線，能確保資料庫在閒置時正確進入 Scale-to-Zero 狀態，節省資源並避免冷啟動頻率。
- **遷移工作流**: 變更 Schema 後，優先使用 `npx drizzle-kit push` 進行開發環境同步；生產環境使用 `npx drizzle-kit generate` 產生遷移檔。
- **型別推導**: 善用 `InferSelectModel` 和 `InferInsertModel` 來產生 TypeScript 型別。

### 2. 身份驗證 (Better Auth)
- **核心路徑**: 認證邏輯位於 `src/lib/auth.ts`，API 路由位於 `app/api/auth/[...all]/route.ts`。
- **權限控制**: 優先使用 Better Auth 的 **Plugins** (如組織管理、MFA)。
- **伺服器端獲取**: 在 Server Components 中使用 `auth.getSession(headers())` 獲取用戶狀態。

### 3. 檔案處理 (Uploadthing)
- **上傳邏輯**: 所有的上傳路徑 (File Routes) 必須在 `src/app/api/uploadthing/core.ts` 定義。
- **安全性**: 在 `onUploadComplete` 之前，必須進行 `middleware` 權限校驗（結合 Better Auth 狀態）。
- **資料儲存**: 上傳成功後，將回傳的 `fileUrl` 存入 Neon 資料庫對應的欄位。

### 4. API 與狀態管理 (tRPC)
- 所有的資料讀寫優先走 tRPC，除非是極簡單的 Server Action。
- 確保每一條 tRPC Route 都有對應的 **Zod** 輸入驗證。

### 5. UI 與組件開發 (HeroUI v3)
- **組件優先**: 所有的 UI 開發必須優先使用 **HeroUI v3** 組件。
- **MCP 整合**: 生成 UI 前，必須檢索 **HeroUI MCP Server** 的 Pro 模板，確保符合設計系統。
- **互動規範**: 優先使用 HeroUI 的語義化屬性（如 `color="secondary"`）並搭配 `framer-motion` 動畫。
- **Selection API (Beta)**: 在 HeroUI v3 Beta 中，`Select` 的 `selectedKey` 與 `onSelectionChange` 已標註為 **deprecated**。
  - **Single Selection**: 應改用 `value` 與 `onChange` 屬性。
  - **State**: 使用純值型別 (string, number) 作為 useState 的初始值，避免在單選模式下使用複雜的 `Set<Key>`。

### 6. TypeScript 與錯誤處理 (Error Handling)
- **避免使用 `any` 型別**: 在 `try...catch` 區塊中，絕對不要使用 `catch (error: any)`。這會觸發 ESLint 警告。TypeScript 中的錯誤預設為 `unknown`，應使用型別斷言 (Type Assertion) 或型別守衛 (Type Guard) 來安全地存取錯誤屬性。
  - **正確寫法範例**: 
    ```typescript
    catch (error) {
      const dbError = error as { code?: string; constraint_name?: string };
      if (dbError?.code === '23505') {
        // 處理特定資料庫錯誤...
      }
      throw error;
    }
    ```
### 7. 日期與時區處理 (Date & Timezone Handling)
- **避免使用原生 Date 物件處理「純日期」**: JavaScript 原生的 `Date` 物件包含時區資訊，使用 `toISOString()` 等方法時常會因為 UTC 偏移導致日期在午夜前後發生跳日（Timezone Trap）。
- **使用 `@internationalized/date`**: 對於只需要「年月日」的場景（如用餐登記），應統一使用 `@internationalized/date` 的 `CalendarDate`。
  - **優點**: 完全不包含時區與時間資訊，保證在任何地理位置看到的日期字串都一致。
  - **Today 獲取**: 應使用 `today(getLocalTimeZone())` 來獲取用戶當前所在時區的日曆日期。
  - **格式化**: 直接使用 `date.toString()` 即可獲得標準的 `YYYY-MM-DD` 格式，避免手動處理字串。

### 8. 資料快取與效能優化 (Next.js Data Cache)
為了降低 Neon 資料庫的運算成本 (Compute Usage) 並提升響應速度，應積極使用 Next.js 的 Data Cache 機制。
- **快取方法**: 使用 `next/cache` 的 `unstable_cache` 封裝資料讀取邏輯。
- **快取函數規範**:
  - **獨立定義**: 快取函數應定義在 tRPC Router 之外，避免每次渲染時重複建立。
  - **直接調用 db**: 快取函數內部應直接從 `~/server/db` 導入 `db` 實例，不要使用傳入的 `ctx.db`（避免非序列化物件傳入引發錯誤）。
  - **標籤管理 (Tags)**: 必須賦予語義化的 `tags`（如 `['stats']`, `['meals']`, `['jobs']`），以便進行精確的「隨選重驗證」(On-Demand Revalidation)。
- **安全與隔離 (Keying)**:
  - 對於具有權限區隔或用戶私有的資料，快取鍵 (Cache Keys) 必須包含用戶唯一識別碼（如 `userId`）或角色識別，防止跨用戶資料洩漏。
- **隨選重驗證 (Revalidation)**:
  - 在執行 `insert`, `update`, `delete` 等異動操作後，必須立即調用 `revalidateTag(tagName)` 來清除對應的快取，確保 UI 資料即時更新。

---

## 📂 專案結構規範
- `src/app/`: 頁面、佈局與 Server Actions。
- `src/server/api/routers/`: tRPC 路由定義。
- `src/server/db/`: 資料庫配置與 Drizzle Schema。
- `src/lib/`: 第三方服務封裝 (auth.ts, uploadthing.ts)。
- `src/components/`: 業務邏輯組件（基於 HeroUI）。

---

## 📝 實作檢查清單
- [ ] UI 是否符合 HeroUI v3 的設計規範？
- [ ] tRPC 路由是否已定義對應的 Zod Schema？
- [ ] Schema 變更是否已執行 `drizzle-kit push`？
- [ ] 敏感操作是否已通過 `auth.getSession()` 驗證身份？
- [ ] 圖片上傳是否具備正確的權限校驗與 Loading 狀態？
- [ ] Neon 的連接字串是否已在 `.env` 中正確配置？
- [ ] 生產環境是否已正確切換為 `neon-http` 連線模式？
- [ ] 是否已手動在 Neon Console 檢查 Scale-to-Zero 的閒置超時設定？
- [ ] 頻繁或耗時的讀取操作是否已實作 `unstable_cache`？
- [ ] 異動操作後是否已調用 `revalidateTag` 清除對應快取？