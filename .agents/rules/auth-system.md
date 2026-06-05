---
trigger: glob
description: 身分驗證系統的開發規範。在處理任何與登入、Session、權限、身分驗證相關的程式碼時，AI 必須嚴格遵循本文件所有規則。
globs: ["src/app/auth/**", "src/app/_components/auth/**", "src/server/better-auth/**", "src/middleware.ts", "src/app/_hooks/useAuth.ts"]
---

# 身分驗證系統開發規範 (Auth System Workspace Rule)

## 1. 系統架構核心

本專案使用 **Better Auth** 作為唯一的身分驗證解決方案，嚴格分為三層：

```text
前端 UI (Client)          後端邏輯 (Server)         資料庫
-----------------         -------------------       --------
useAuth (Global Hook) →   Better Auth Server   →    Drizzle ORM (pg)
src/app/_hooks/useAuth.ts src/server/better-auth/   src/server/db
```

**禁止** 使用任何其他身分驗證函式庫（如 NextAuth、Auth.js、Clerk）。

---

## 2. 強制使用的工具函式與 Hooks

### 2.1 服務端 (Server Components / Server Actions / tRPC)

| 工具 | 位置 | 用途 |
|------|------|------|
| `getSession` | `~/server/better-auth/server` | **唯一**的 Server-side session 取得方式 |
| `auth` | `~/server/better-auth` | 呼叫 `auth.api.*` 的 Better Auth 實例 |
| `protectedProcedure` | `~/server/api/trpc` | 需要登入的 tRPC 程序 |
| `managerProcedure` | `~/server/api/trpc` | 需要 ADMIN 或 MANAGER 角色 |
| `adminProcedure` | `~/server/api/trpc` | 需要 ADMIN 角色 |

**正確範例：**
```ts
// 在 Server Component 中取得 Session 作為路由守衛
import { getSession } from "~/server/better-auth/server";

const session = await getSession(); // 已透過 React.cache() 優化，不會重複查詢
if (!session) redirect("/auth");
```

**禁止範例：**
```ts
// ❌ 禁止在 Server Component 中直接呼叫 auth.api.getSession
import { auth } from "~/server/better-auth";
const session = await auth.api.getSession({ headers: await headers() }); // 應改用 getSession()
```

### 2.2 客戶端權限控制 (Client Components) - The `useAuth` Hook

在客戶端，**絕對禁止**直接使用原始的 `authClient.useSession()` 進行權限判斷，也**禁止**從 Server Component 將 `session.user` 或權限狀態透過 Props 往下傳遞（Prop-drilling）。

所有 Client Components 必須**自主呼叫全域智能 Hook `useAuth()`** 來取得會話與權限狀態。

| 工具 | 位置 | 用途 |
|------|------|------|
| `useAuth()` | `~/app/_hooks/useAuth` | **唯一**的前端權限、Session 與角色判斷來源 |
| `authClient.signIn` | `~/server/better-auth/client` | 登入操作 (email, social) |
| `authClient.signOut` | `~/server/better-auth/client` | 登出操作 |

**正確範例 (Auth Session Exception Pattern)：**
```tsx
// ✅ 在 Client Component 中自主判斷權限
"use client";
import { useAuth } from "~/app/_hooks/useAuth";

export function EditButton({ activityId }) {
  // O(1) 複雜度的高效權限查詢
  const { isActivityEditor, isAdmin } = useAuth(); 
  
  if (!isActivityEditor(activityId)) return null;
  return <Button>編輯</Button>;
}
```

**禁止範例：**
```tsx
// ❌ 禁止從 Server 傳遞 session 給 Client
<ClientComponent session={session} /> 

// ❌ 禁止在 UI 元件內直接使用原始 authClient
const { data: session } = authClient.useSession(); 
```

---

## 3. 路由保護規範

### 3.1 Middleware 保護（主要防線）

路由保護由 `src/middleware.ts` 統一處理。目前受保護的路徑：

```ts
matcher: ["/", "/activity/:path*", "/process/:path*"]
```

- **規則**：未登入的請求一律重定向至 `/auth`。
- **修改**：新增受保護路由時，必須同步更新 `matcher` 陣列。
- **禁止**：在個別 Server Component 中重複實作路由保護邏輯（避免雙重冗餘）。

### 3.2 Server Component 額外檢查（次要防線）

```ts
// 僅在需要 session 資料的 Server Component 中使用
const session = await getSession();
if (!session) redirect("/auth");
```

---

## 4. 角色與精細權限系統 (RBAC + ABAC)

系統採用混合權限模型：基本身分由 Role 決定，精細操作權限由 `useAuth()` 的 Set 結構進行 `O(1)` 複雜度比對。

### 4.1 基本角色 (Role)
| 角色 | 權限範圍 | tRPC 程序 |
|------|---------|-----------|
| `ADMIN` | 所有操作 (若 approvedArea 為 ALL 則為 SuperAdmin) | `adminProcedure` |
| `MANAGER` | 管理功能（非刪除核心資料）| `managerProcedure` |
| `VIEWER` | 唯讀 | `protectedProcedure` |

### 4.2 精細權限檢驗 (Client-Side)
請一律使用 `useAuth()` 提供的 Helper 函數，這些函數內部已實作 `O(1)` Set 查詢，確保在渲染包含數百個 Checkbox 的表格時不會卡頓：
- `isActivityEditor(activityId, creatorId, areaId)`: 是否有權編輯該活動。
- `isProcessChecker(processId, activityId, creatorId, areaId)`: 是否有權操作該流程的 Checkbox。

---

## 5. 表單開發規範 (Auth UI)

### 5.1 核心依賴套件
- `react-hook-form`, `zod`, `@hookform/resolvers`, `@heroui/react` (v3+).

### 5.2 禁止直接使用原始 Controller (Controlled Component Pattern)
所有 auth 表單輸入框必須使用 **Controlled** 元件封裝，將 `fieldState.error` 映射至 HeroUI 的 `isInvalid` 與 `<FieldError>`。

**正確使用方式：**
```tsx
import { ControlledTextField } from "~/app/_components/auth/controlled-text-field";

<ControlledTextField
  control={form.control}
  name="email"
  label="電子郵件"
/>
```

### 5.3 錯誤處理模式
Better Auth 返回的錯誤代碼必須透過 `errorMap` 轉換為中文訊息，並使用 `MessageDialog` 顯示。

---

## 6. Server / Client 邊界規範

| 環境 | 可使用 | 禁止 |
|------|--------|------|
| Server Component | `getSession`, `auth.api.*` | `useAuth`, `authClient`, 傳遞 session 作為 prop |
| Client Component | `useAuth()`, `authClient.signIn/signOut` | `getSession`, 直接呼叫 `authClient.useSession()` |
| Middleware | `auth.api.getSession({ headers })` | 任何客戶端工具 |

---

## 7. 類型安全規範

- **永遠**使用 `Session` 類型，從 `~/server/better-auth/config` 匯入。
- **禁止**使用 `any` 來繞過 session 類型。

---

## 8. 新增功能規範

| 需求 | 動作 |
|------|------|
| 新增社群登入 | 在 `config.ts` 的 `socialProviders` 中新增，並在 `auth-card.tsx` 加入對應按鈕 |
| 新增表單欄位 | 先更新 `auth-schemas.ts`，再修改對應的 Form 元件 |
| 新增權限判斷 | 在 `useAuth.ts` 中新增 Helper function 並返回 |