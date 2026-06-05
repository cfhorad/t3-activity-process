---
trigger: glob
description: Comprehensive guidelines for optimizing Next.js applications in 2026 (Next.js 16+), emphasizing the React Compiler, Cache Components (`use cache`), Turbopack, tRPC caching, and Core Web Vitals.
globs: src/**/*.{ts,tsx}
---

# Next.js 16+ Performance Optimization Guidelines (2026 Standards)

Use this skill whenever optimizing performance, reducing bundle sizes, improving page load speeds, or implementing data caching in a modern Next.js 16+ (App Router) application. 

**CRITICAL RULE:** Do not apply outdated Next.js 13/14 patterns (like `unstable_cache` or manual `useMemo`) to a Next.js 16+ codebase.

## 1. Architectural Defaults & The React Compiler

- **React Compiler (Stable):** Next.js 16 ships with a stable React Compiler. **Do not use manual `useMemo` or `useCallback`** unless strictly necessary. The compiler automatically memoizes components and hooks. Focus purely on writing clean, idiomatic React.
- **Turbopack by Default:** Always use Turbopack for local development and production builds. It provides up to 10x faster Fast Refresh and 5x faster production builds compared to Webpack.
- **Layout Deduplication:** Next.js 16 automatically deduplicates layouts and uses incremental prefetching. Do not implement custom prefetching logic; rely on the built-in `<Link>` component.

## 2. Caching: The `use cache` Directive

Next.js 16 replaces experimental Partial Pre-Rendering (PPR) flags and `unstable_cache` with a robust, granular **Cache Components** architecture using the `use cache` directive.

- **Direct DB Access:** Always define your cached functions **outside** of the tRPC router and import your `db` instance directly.
- **`use cache` Placement:** Place the `'use cache'` directive at the top of the function or file to opt into caching.
- **Security Keying:** For user-specific data, pass the user identifier as an argument so it inherently becomes part of the cache key.
- **Tagging:** Export `cacheTag` or use the `cacheLife` configuration to manage revalidation.

```typescript
// ✅ 2026 Standard: Direct DB import, 'use cache' Directive
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { stats } from "~/server/db/schema";
// In Next.js 16, use the new caching directives
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from "next/cache";

export async function getCachedUserStats(userId: string) {
  'use cache';
  cacheLife('hours'); // Set lifecycle
  cacheTag('stats');  // Tag for manual revalidation
  
  return await db.query.stats.findFirst({ where: eq(stats.userId, userId) });
}
```

### Server Cache Invalidation (`revalidateTag`)
- Upon any mutation (create, update, delete), immediately invoke `revalidateTag('stats')` in the server action or route handler to purge the stale server cache.

## 3. Client-Side tRPC Caching & Optimistic Updates

While the server uses `use cache`, the client uses the tRPC React query cache:
- Use `const utils = trpc.useUtils()` whenever working with the tRPC React cache.
- Call `utils.routerName.invalidate()` after successful mutations to ensure fresh data on the client.
- For immediate UI feedback, use `onMutate` with `utils.routerName.setData()` to perform Optimistic Updates.

## 4. React Server Components (RSC) vs. Client Components

- **Default to Server Components:** Keep components as Server Components by default to send zero JavaScript to the client. Next.js 16 features up to 350% faster payload deserialization for RSCs.
- **Push `'use client'` Down:** Only place `'use client'` at the lowest possible level in the component tree where interactivity (e.g., `useState`, `onClick`) is strictly necessary. Never wrap an entire page or layout in `'use client'`.

## 5. Image & Font Optimization (LCP & CLS)

- **`next/image` (`preload`):** Strictly use the `<Image />` component. In Next.js 16, **prefer using the `preload` attribute** instead of the deprecated `priority` prop for your Largest Contentful Paint (LCP) images (e.g., hero images).
- **`sizes` Prop:** Always use the `sizes` prop for responsive images to prevent downloading oversized assets.
- **`next/font`:** Use `next/font/google` or `next/font/local` to self-host fonts and prevent layout shifts (`font-display: swap`).

## 6. Async Dynamic APIs (Next.js 15+)

- **Async Everything:** APIs like `cookies()`, `headers()`, and `searchParams` (in page props) are strictly asynchronous. **You must `await` them** before accessing their values.
  ```tsx
  // ✅ Correct 2026 Next.js pattern
  export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    // ...
  }
  ```
- **Fetch Caching:** `fetch` requests are **not** cached by default. You must explicitly specify `cache: 'force-cache'` (or use the `use cache` directive) if you want static data.