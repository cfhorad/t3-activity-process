# 可攜式身分驗證元件 (Portable Auth Components)

此資料夾包含了使用 **HeroUI v3** 構建、並專為 **Better Auth** 設計的高度可重複使用的身分驗證 UI 元件。它們的結構設計使得您可以輕鬆地將其放入任何 Next.js 專案中。

## 元件總覽

### `auth-card.tsx`
核心的統一身分驗證元件。
- **功能**：渲染一個帶有 HeroUI Tabs 的卡片，允許使用者在「登入」和「註冊」流程之間無縫切換，無需重新載入頁面。
- **特色**：內建表單欄位、載入狀態以及錯誤處理的狀態管理。使用透過 props 傳入的 `authClient` 來執行登入/註冊請求。
- **Props (屬性)**：
  - `authClient`：Better Auth 客戶端實例 (`ReturnType<typeof createAuthClient>`)。
  - `onSuccess`：身分驗證成功時執行的回呼函式（例如：重新導向至儀表板）。
  - `defaultTab`：`"login" | "register"`，用於控制預設開啟的標籤頁。

### `message-dialog.tsx`
- **功能**：一個可重複使用的 HeroUI `AlertDialog` 元件，用於顯示使用者友好的在地化錯誤訊息（例如：「電子郵件或密碼不正確」）。
- **特色**：當 `AuthCard` 捕捉到來自 Better Auth API 的錯誤時會自動彈出。

---

## 如何整合至新專案中

請按照以下步驟將此身分驗證流程整合到新的 Next.js 應用程式中。

### 1. 複製核心資料夾
將此完整的 `auth` 資料夾複製到新專案的 components 資料夾中：
```bash
cp -r src/app/_components/auth my-new-project/src/app/_components/auth
```

### 2. 建立身分驗證路由 (`src/app/auth/page.tsx`)
在新專案中的 `src/app/auth/page.tsx` 建立一個新檔案來渲染 `AuthCard`。

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
// 重要：匯入您專案中特定的 better-auth 客戶端
import { authClient } from "~/server/better-auth/client"; 
import { AuthCard } from "../_components/auth/auth-card";

function AuthPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");
	
	// 如果 URL 中有 ?tab=register 則開啟註冊標籤，否則預設為登入
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
		// 必須使用 Suspense 包覆，因為我們使用了 useSearchParams()
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<AuthPageContent />
		</Suspense>
	);
}
```

### 3. 設定 Next.js Middleware (`src/middleware.ts`)
為了保護您的路由並將未經驗證的使用者重新導向至新的整合式 `/auth` 頁面，請更新您的 middleware：

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
	const session = await getSessionCookie(request, {
		// 確保這與您的 better-auth 設定相符
		cookiePrefix: "better-auth",
	});

	if (!session) {
		// 將未經驗證的使用者重新導向至 AuthCard
		return NextResponse.redirect(new URL("/auth", request.url));
	}
	return NextResponse.next();
}

export const config = {
	// 在此處加入您想要保護的路由
	matcher: ["/", "/dashboard/:path*", "/process/:path*"],
};
```

### 4. 更新導航連結
當您需要從應用程式的其他部分（例如導航列 Navbar）連結至身分驗證流程時，請使用以下 URL 模式：
- **前往登入**：`<Link href="/auth">登入 (Sign In)</Link>`
- **前往註冊**：`<Link href="/auth?tab=register">註冊 (Sign Up)</Link>`
- **登出時**：
```tsx
await authClient.signOut({
    fetchOptions: {
        onSuccess: () => {
            // 強制進行完整重新導向以清除客戶端狀態
            window.location.href = "/auth";
        },
    },
});
```

### 依賴套件需求
請確保您的目標專案已安裝以下套件：
- `@heroui/react` (v3+)
- `better-auth`
- `framer-motion` (HeroUI peer dependency)
