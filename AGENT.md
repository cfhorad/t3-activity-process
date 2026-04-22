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