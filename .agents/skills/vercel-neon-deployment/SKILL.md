---
name: vercel-neon-deployment
description: Guidelines for deploying Next.js applications on Vercel with Neon Serverless Postgres, including environment variable setup, Better Auth production URLs, and dual-driver TypeScript compatibility fixes.
---

# Deploying Next.js with Neon Database & Better Auth on Vercel

Use this skill whenever deploying a Next.js application using Neon Serverless Postgres and Better Auth to Vercel, or troubleshooting deployment/database connection issues.

---

## 1. Environment Variables Checklist

When deploying to Vercel, you must configure the following environment variables in the Vercel Dashboard (Project Settings -> Environment Variables).

### Database Configuration
* **`DATABASE_URL`**: The connection string from your Neon Database console.
  > [!IMPORTANT]
  > Use the **Pooled** connection string (typically containing `-pooler` in the hostname) for the application runtime to prevent connection exhaustion under serverless scaling. For database migrations (`drizzle-kit push` or `db:migrate`), use the **Direct (Unpooled)** connection string.

### Better Auth Configuration
* **`BETTER_AUTH_URL`**: The canonical production URL of your application (e.g., `https://your-app.vercel.app`).
  > [!WARNING]
  > If this is not set or points to localhost, Better Auth will attempt to route authentications and database checks locally (`127.0.0.1:5432`), causing `ECONNREFUSED` connection errors.
* **`BETTER_AUTH_SECRET`**: A cryptographically secure random string used to sign sessions. Generate one using:
  ```bash
  npx better-auth secret
  ```

### Google OAuth Configuration
* **`GOOGLE_CLIENT_ID`**: Google Cloud Console client ID.
* **`GOOGLE_CLIENT_SECRET`**: Google Cloud Console client secret.
  > [!NOTE]
  > Ensure that in your Google Developer Console, you add the Vercel production callback URL under **Authorized redirect URIs** (e.g., `https://your-app.vercel.app/api/auth/callback/google`).

---

## 2. Dual-Driver Architecture (Local dev vs. Production)

To optimize speed during development and prevent persistent connection lockouts in production, we use two separate drivers:

1. **`postgres-js`** locally (maintains stateful pool and singleton pattern to survive Next.js HMR).
2. **`neon-http`** in production (stateless HTTP connections, allowing Neon to Scale-to-Zero and reducing cold starts).

### The TypeScript Union & Peer Dependency Problem

Because `pnpm` resolves different peer dependency trees for `drizzle-orm/neon-http` and `drizzle-orm/postgres-js`, they reside in separate isolated directories. TypeScript treats private fields (such as `shouldInlineParams` inside Drizzle's `SQL` class) nominally, which means:
* A union type like `NeonHttpDatabase | PostgresJsDatabase` cannot be successfully called.
* Custom SQL templates (`sql` template literal tag) from `drizzle-orm` will raise assignment errors due to type mismatches.

### The Solution: Intersection Cast

By casting the exported `db` to an **intersection type** rather than a union type, we satisfy the compiler for all queries, transactions, deletes, inserts, and template literals:

```typescript
// src/server/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const createDb = () => {
  if (env.NODE_ENV === "production") {
    // Fallback to a placeholder string at build-time if environment variables are not fully loaded in the build environment
    const databaseUrl = env.DATABASE_URL || "postgresql://placeholder-for-build-time.local/db";
    const sql = neon(databaseUrl);
    return drizzleHttp({ client: sql, schema });
  }

  const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
  globalForDb.conn = conn;
  return drizzlePg({ client: conn, schema });
};

// Cast to intersection type to solve TS Union & nominal peer dependency conflicts
export const db = createDb() as unknown as PostgresJsDatabase<typeof schema> & NeonHttpDatabase<typeof schema>;

```

---

## 3. Handling Dynamic Raw Query Results

When running raw queries using `db.execute()`, the HTTP driver returns an object with a `.rows` property (`{ rows: any[] }`), while the Postgres client driver returns a direct array.

Because the database is typed as an intersection, TypeScript will narrow the return value to `never` in the `else` branch of an `Array.isArray()` check due to array-type narrowing contradictions.

### Correct Pattern for Parsing `db.execute`

Always cast both branches explicitly when parsing raw result rows:

```typescript
const result = await db.execute<{ value: string | null }>(
  sql`SELECT ${googleSheetData.data}->>${columnName} as value 
      FROM ${googleSheetData} 
      WHERE ${googleSheetData.processId} = ${processId}`
);

// Cast both branches explicitly to ensure correct type-narrowing and loop type-safety
const rows = Array.isArray(result)
  ? (result as unknown as { value: string | null }[])
  : (result as unknown as { rows: { value: string | null }[] }).rows;

for (const row of rows) {
  if (row.value) {
    // row.value is correctly inferred as string | null
    const parts = row.value.split(',').map(p => p.trim());
    // ...
  }
}
```

---

## 4. Vercel Project Setup Steps

1. **Import Project**: Connect your GitHub repository to Vercel.
2. **Environment Variables**: Add all environment variables listed in Section 1.
3. **Build Command**: Set the Build Command to `npm run build` or `pnpm run build`.
4. **Deploy**: Trigger the initial build.
5. **Database Push**: To apply schemas to the Neon database:
   ```bash
   DATABASE_URL="YOUR_DIRECT_UNPOOLED_NEON_URL" pnpm db:push
   ```
