# 高階身分驗證 UI 模組 (Premium Auth UI Module)

此模組是基於 **HeroUI v3 (Next.js 15)**、**Better Auth**、**React Hook Form** 與 **motion** 打造的專業級驗證解決方案。它不僅實現了功能上的模組化，更在使用者體驗（UX）上做了深度優化。

## 核心亮點 (Premium Features)

- **流暢動效**：使用 `motion` 實作分頁切換時的位移與淡入效果，提升介面流暢度。
- **智慧輸入**：`ControlledTextField` 支援密碼顯示/隱藏切換，並具備自動聚焦功能。
- **完整載入感**：包含表單提交與社群登入（Google）的獨立載入狀態與防重複點擊邏輯。
- **無障礙優化**：所有圖示與輸入框皆符合 A11y 標準，包含自動產生的 ARIA 標籤與鍵盤支援。

## 檔案結構與職責

### 1. `auth-card.tsx` (主容器)
- **職責**：管理分頁狀態、動畫切換、社群登入逻辑。
- **技術**：整合 `AnimatePresence` 與 `Tabs`，提供沉浸式切換體驗。

### 2. `controlled-text-field.tsx` (原子組件)
- **職責**：封裝 HeroUI `TextField` 與 RHF `Controller`。
- **功能**：自動處理驗證錯誤、支援密碼切換按鈕。

### 3. `auth-icons.tsx` (圖示庫)
- **職責**：集中管理 SVG 圖示（Lock, Google, Eye, EyeOff）。
- **特點**：已修復路徑錯誤並內建無障礙 `<title>`。

### 4. `auth-schemas.ts` & `login-form.tsx` / `register-form.tsx`
- **職責**：將驗證邏輯與 UI 完全隔離，便於快速擴展（如：增加手機驗證或雙重驗證）。

---

## 整合指南

### 1. 必備套件
```bash
pnpm add @heroui/react motion react-hook-form zod @hookform/resolvers better-auth
```

### 2. 設定 Providers (解決 Server Component 匯入問題)
由於 HeroUI 元件皆為 Client Components，請建立 `src/app/providers.tsx`：

```tsx
// src/app/providers.tsx
"use client";

import { Toast } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Toast.Provider />
			{children}
		</>
	);
}
```

並在 `src/app/layout.tsx` 中引用：

```tsx
// src/app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
	return (
		<html lang="zh-TW">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
```

### 3. 使用範例 (完整 Auth Page)
在 `src/app/auth/page.tsx` 中使用：

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "~/server/better-auth/client";
import { AuthCard } from "../_components/auth/auth-card";

function AuthPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");

	// 根據網址參數決定預設顯示 登入 或 註冊
	const defaultTab = tab === "register" ? "register" : "login";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
			<AuthCard
				authClient={authClient}
				defaultTab={defaultTab}
				onSuccess={() => router.push("/")}
			/>
		</div>
	);
}

export default function AuthPage() {
	return (
		// 由於使用了 useSearchParams，必須包裹在 Suspense 中以支援串流渲染
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<AuthPageContent />
		</Suspense>
	);
}
```

---

## 維護指南
- **調整動畫速度**：修改 `auth-card.tsx` 中的 `transition` 設定。
- **修改驗證語系**：至 `auth-schemas.ts` 修改 Zod 的錯誤訊息。
- **擴展輸入框功能**：在 `controlled-text-field.tsx` 中增加新的 `TextField` 屬性。
