---
trigger: glob
globs: src/**/*.{ts,tsx}
---

# Next.js 路由導覽規範 (避免使用 window.location.href)

## 核心規則
在 Next.js 應用程式中進行頁面跳轉或路由導覽時，**嚴格禁止**使用 `window.location.href = "..."` 或是沒有特殊需求的純 `<a href="...">` 標籤。

## 為什麼？
使用 `window.location.href` 會強迫瀏覽器執行「硬重新整理 (Hard Reload)」，這完全破壞了 Next.js 作為 Single Page Application (SPA) 的流暢體驗。這會導致以下負面影響：
1. **畫面閃爍 (Flashing)**：整個畫面會先變白再重新渲染，導致使用者體驗非常差（例如導覽列突然消失再出現）。
2. **效能低落**：會重新載入並執行所有 JavaScript、CSS 與不必要的網路請求。
3. **狀態遺失**：任何在前端保留的 Context 或 State 都會被完全清空。

## 正確做法：使用 Next.js 原生路由

### 1. 程式化導覽 (Programmatic Navigation)
當你需要在事件處理函數 (如 onClick, onSubmit) 中觸發路由切換時，必須從 `next/navigation` 引入 `useRouter`：

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

export function NavigationButton() {
  const router = useRouter();

  const handleGoToProfile = () => {
    // ✅ 正確做法：使用 router.push 進行客戶端平滑跳轉
    router.push("/profile");
    
    // ❌ 錯誤做法：會造成畫面閃爍和完整重載
    // window.location.href = "/profile"; 
  };

  return <Button onPress={handleGoToProfile}>前往個人主頁</Button>;
}
```

### 2. 靜態/宣告式導覽 (Declarative Navigation)
對於導覽列項目、文字連結等 UI 元素，必須使用 Next.js 的 `<Link>` 元件：

```tsx
import Link from "next/link";

export function NavItem() {
  return (
    // ✅ 正確做法：使用 Next.js 的 Link，自動支援 Prefetching 和客戶端路由
    <Link href="/profile" className="text-blue-500 hover:underline">
      個人主頁
    </Link>
    
    // ❌ 錯誤做法：原生的 a 標籤會導致硬重新整理
    // <a href="/profile">個人主頁</a>
  );
}
```
