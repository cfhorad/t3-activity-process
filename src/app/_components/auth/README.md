# 高階身分驗證 UI 模組 (Premium Auth UI Module)

此模組是基於 **HeroUI v3 (Next.js 15)**、**Better Auth**、**React Hook Form** 與 **Framer Motion** 打造的專業級驗證解決方案。它不僅實現了功能上的模組化，更在使用者體驗（UX）與開發規範（DX）上做了深度優化。

## ⚠️ 開發規範 (Development Standards)

本模組的所有開發與維護必須嚴格遵循專案內的 **AI 代理規則**：
👉 **[.agents/rules/auth-system.md](file:///Volumes/OWC Envoy Ultra/codes/NEXTJS/t3-activity-process/.agents/rules/auth-system.md)**

### 核心規則摘要：
1. **核心依賴**：必須使用 `react-hook-form`, `zod`, `@hookform/resolvers`, `@heroui/react`。
2. **受控元件模式 (Controlled Component Pattern)**：禁止在業務表單中直接使用「裸」的 `Controller`。所有輸入框必須使用 `ControlledTextField` 封裝，以確保 HeroUI v3 的 A11y 結構與狀態正確橋接。
3. **錯誤處理**：使用 `errorMap` 將 Better Auth 的錯誤代碼轉換為友善的中文訊息。

---

## 核心亮點 (Premium Features)

- **流暢動效**：使用 `motion` 實作分頁切換時的位移與淡入效果，提升介面流暢度。
- **智慧輸入**：`ControlledTextField` 支援密碼顯示/隱藏切換，並具備自動聚焦功能。
- **完整載入感**：包含表單提交與社群登入（Google）的獨立載入狀態與防重複點擊邏輯。
- **無障礙優化**：所有圖示與輸入框皆符合 A11y 標準，包含自動產生的 ARIA 標籤與鍵盤支援。

## 檔案結構與職責

### 1. `auth-card.tsx` (主容器)
- **職責**：管理分頁狀態、動畫切換、社群登入邏輯。
- **技術**：整合 `AnimatePresence` 與 `Tabs`，提供沉浸式切換體驗。

### 2. `controlled-text-field.tsx` (原子組件)
- **職責**：封裝 HeroUI `TextField` 與 RHF `Controller`。
- **功能**：遵循「受控元件模式」，自動處理驗證錯誤、支援密碼切換按鈕。

### 3. `auth-icons.tsx` (圖示庫)
- **職責**：集中管理 SVG 圖示（Lock, Google, Eye, EyeOff）。
- **特點**：內建無障礙 `<title>`。

### 4. `auth-schemas.ts` & `login-form.tsx` / `register-form.tsx`
- **職責**：將驗證邏輯與 UI 完全隔離，集中管理 Zod Schema。

---

## 整合指南

### 1. 必備套件
```bash
pnpm add @heroui/react motion react-hook-form zod @hookform/resolvers better-auth
```

### 2. 設定 Providers
確保 `src/app/providers.tsx` 已設定 `Toast.Provider`（HeroUI v3 需求）。

### 3. 使用範例
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
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<AuthPageContent />
		</Suspense>
	);
}
```

---

## 維護指南
- **調整元件行為**：修改 `controlled-text-field.tsx` 時，務必參考 `auth-system.md` 中的「封裝模式」。
- **修改驗證語系**：至 `auth-schemas.ts` 修改 Zod 的錯誤訊息。
- **擴展權限**：若涉及角色權限修改，請參閱 `auth-system.md` 的 RBAC 章節。
