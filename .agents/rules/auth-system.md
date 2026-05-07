---
trigger: model_decision
description: 身分驗證系統的開發規範。在處理任何與登入、Session、權限、身分驗證相關的程式碼時，AI 必須嚴格遵循本文件所有規則。
globs: ["src/app/auth/**", "src/app/_components/auth/**", "src/server/better-auth/**", "src/middleware.ts"]
---

# 身分驗證系統開發規範 (Auth System Workspace Rule)

## 1. 系統架構核心

本專案使用 **Better Auth** 作為唯一的身分驗證解決方案，嚴格分為三層：

```
前端 UI (Client)          後端邏輯 (Server)         資料庫
-----------------         -------------------       --------
authClient (react)   →    Better Auth Server   →    Drizzle ORM (pg)
src/server/better-auth/   src/server/better-auth/   src/server/db
client.ts                 config.ts + server.ts
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
// 在 Server Component 中取得 Session
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

### 2.2 客戶端 (Client Components)

| 工具 | 位置 | 用途 |
|------|------|------|
| `authClient` | `~/server/better-auth/client` | **唯一**的客戶端 auth 操作實例 |
| `authClient.useSession()` | — | 取得客戶端 session（用於 UI 顯示） |
| `authClient.signIn.email()` | — | 電子郵件登入 |
| `authClient.signUp.email()` | — | 電子郵件註冊 |
| `authClient.signIn.social()` | — | 社群登入（目前僅支援 `google`） |
| `authClient.signOut()` | — | 登出 |

**正確範例：**
```tsx
// 在 Client Component (Navbar) 中
import { authClient } from "~/server/better-auth/client";

const { data: clientSession } = authClient.useSession();
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

## 4. 角色與權限系統 (RBAC)

系統定義三種角色，存儲在 `user.role` 欄位（預設為 `VIEWER`）：

| 角色 | 權限範圍 | tRPC 程序 |
|------|---------|-----------|
| `ADMIN` | 所有操作 | `adminProcedure` |
| `MANAGER` | 管理功能（非刪除核心資料）| `managerProcedure` |
| `VIEWER` | 唯讀 | `protectedProcedure` |

**規則**：
- 新增 tRPC 程序時，必須明確選擇適當的 procedure 類型，不得預設使用 `publicProcedure`。
- 前端 UI 的權限檢查（顯示/隱藏按鈕）應讀取 `session.user.role`，但不能替代後端的權限驗證。

---

## 5. 表單開發規範 (Auth UI)

### 5.1 核心依賴套件 (Mandatory Packages)

在開發 Auth UI 前，必須確保專案已安裝以下套件：
- `react-hook-form`: 表單狀態管理核心。
- `zod`: 模式驗證。
- `@hookform/resolvers`: 將 Zod 與 React Hook Form 橋接。
- `@heroui/react`: UI 組件庫（v3+）。

---

### 5.2 禁止直接使用原始 Controller (Controlled Component Pattern)

所有 auth 表單輸入框必須使用 **Controlled** 元件封裝。這不僅是為了樣式統一，更為了確保 HeroUI v3 的無障礙 (A11y) 結構與 `react-hook-form` 的狀態正確橋接。

#### 封裝模式 (The Pattern)
若需建立新的受控元件（如 `ControlledSelect`），必須遵循以下模式：

1.  **所需依賴**：必須匯入 `react-hook-form` 的 `Control`, `Controller`, `FieldPath`, `FieldValues` 以及 `@heroui/react` 的對應組件。
2.  **泛型約束**：使用 `<TFieldValues extends FieldValues>` 確保 `control` 與 `name` 類型安全。
3.  **狀態橋接**：將 `fieldState.error` 映射至 `isInvalid` 與 `<FieldError>`。
4.  **Slot 結構**：遵循 HeroUI v3 的 `TextField/Select` -> `Label` -> `Input` 結構。

**實作範例：**
```tsx
export function ControlledField<T extends FieldValues>({ control, name, label }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField isInvalid={!!fieldState.error} {...field}>
          <Label>{label}</Label>
          <Input />
          <FieldError>{fieldState.error?.message}</FieldError>
        </TextField>
      )}
    />
  );
}
```

**正確使用方式：**
```tsx
import { ControlledTextField } from "~/app/_components/auth/controlled-text-field";

<ControlledTextField
  control={form.control}
  name="email"
  label="電子郵件"
  type="email"
  autoComplete="email"
/>
```

**禁止範例：**
```tsx
// ❌ 禁止在業務表單中直接使用裸 Controller
<Controller
  control={control}
  name="email"
  render={({ field }) => <input {...field} />}
/>
```

### 5.2 Zod Schema 管理

- 所有 auth 相關的驗證 schema 必須集中在 `auth-schemas.ts`。
- `registerSchema` 必須基於 `loginSchema` 使用 `.extend()`，確保一致性。
- 錯誤訊息使用中文。

### 5.3 錯誤處理模式

Better Auth 返回的錯誤代碼（`ctx.error.code`）必須透過 `errorMap` 物件轉換為使用者可讀的中文訊息，並使用 `MessageDialog` 元件顯示。

```ts
const errorMap: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "電子郵件或密碼不正確",
  USER_ALREADY_EXISTS: "此電子郵件已被註冊",
  // ... 根據 Better Auth 文件持續擴充
};
```

---

## 6. Server / Client 邊界規範

| 環境 | 可使用 | 禁止 |
|------|--------|------|
| Server Component | `getSession`, `auth.api.*` | `authClient`, `useSession`, React Hooks |
| Client Component | `authClient.*`, `authClient.useSession()` | `getSession`, 直接呼叫 Drizzle |
| Middleware | `auth.api.getSession({ headers })` | 任何客戶端工具 |

- **所有 auth 相關的 UI 元件必須有 `"use client"` 指令**。
- `getSession` 在 `server.ts` 中已用 `React.cache()` 包裹，同一次請求的多次呼叫只會執行一次資料庫查詢，不需要額外快取。

---

## 7. 類型安全規範

- **永遠**使用 `Session` 類型，從 `~/server/better-auth/client` 或 `~/server/better-auth/config` 匯入。
- **禁止**使用 `any` 來繞過 session 類型。
- 使用 Better Auth 的 `$Infer` 工具確保類型與執行時一致。

```ts
import type { Session } from "~/server/better-auth/client";
```

---

## 8. 新增功能規範

| 需求 | 動作 |
|------|------|
| 新增社群登入（如 GitHub） | 在 `config.ts` 的 `socialProviders` 中新增，並在 `auth-card.tsx` 加入對應按鈕 |
| 新增表單欄位 | 先更新 `auth-schemas.ts`，再修改對應的 Form 元件 |
| 新增使用者欄位 | 在 `config.ts` 的 `user.additionalFields` 中聲明，並執行資料庫 migration |
| 新增保護路由 | 更新 `middleware.ts` 的 `matcher` 陣列 |
| 新增 SVG 圖示 | 加入 `auth-icons.tsx`，必須包含非空的 `<title>` 標籤 |