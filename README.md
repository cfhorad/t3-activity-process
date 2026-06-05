# T3-anho-dining

A modern web application built with the T3 Stack, featuring a robust setup for authentication, database management, and type-safe APIs.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **API**: [tRPC](https://trpc.io/) (Type-safe API)
- **UI Components**: [HeroUI v3 (Beta)](https://heroui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Tooling**: [Biome](https://biomejs.dev/) (Linting & Formatting)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd t3-inital
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/t3_db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-here"
```

### 4. Database Setup

```bash
# Generate migrations
pnpm db:generate

# Push changes to database
pnpm db:push

# Open Drizzle Studio to view data
pnpm db:studio
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

- `pnpm dev`: Runs the app in development mode with Turbopack.
- `pnpm build`: Builds the app for production.
- `pnpm start`: Runs the built app in production mode.
- `pnpm check:write`: Lints and formats the code using Biome.
- `pnpm typecheck`: Runs TypeScript type checking.
- `pnpm db:*`: Database management scripts (generate, migrate, push, studio).

## 🗂️ Project Structure

- `src/app`: Next.js App Router pages and components.
- `src/server`: Backend logic, including database schema and tRPC routers.
- `src/trpc`: tRPC client and server configuration.
- `src/styles`: Global CSS and styling files.

## 🔐 Authentication Custom Hook (`useAuth`)

The custom hook [`useAuth`](src/app/_hooks/useAuth.ts) is a client-side hook for managing user sessions and computed role privileges safely while supporting Next.js Server-Side Rendering (SSR) and Better Auth.

### Core Design & Features

1. **SSR-Safe Hydration Guard**:
   Uses an `isMounted` mount state indicator to prevent React hydration mismatch errors by deferring client-only logic until after the component has mounted on the client.
2. **SSR Fallback Support**:
   Accepts an optional `serverSession` parameter passed from a Server Component. It immediately falls back to this server-side session to guarantee faster visual loading before client hydration.
3. **Role-Based Access Control (RBAC)**:
   - Computes standard flags based on user roles: `isAdmin`, `isManager`, `isViewer`.
   - Combines common permission sets, such as `isManagerOrAdmin`, for simpler view-level gating.
4. **tRPC Area Permission Syncing**:
   - Automatically queries the user's application statuses using the client-side tRPC query `api.user.getMyAreaStatuses` once mounted and authenticated.
   - Maps the list of approved area identifiers to `approvedAreaIds`.
   - Checks if the user is a `isSuperAdmin` (requires the `"ADMIN"` role and an approved area containing `"ALL"`).

### Returned Properties

The hook returns the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `session` | `Session \| null` | The current session object (uses the client-side hook or the server fallback). |
| `user` | `Session["user"] \| undefined` | The active user details inside the current session. |
| `isLoading` | `boolean` | `true` if the tRPC request for area permission status is loading. |
| `isAdmin` | `boolean` | `true` if the user's role is `"ADMIN"`. |
| `isManager` | `boolean` | `true` if the user's role is `"MANAGER"`. |
| `isViewer` | `boolean` | `true` if the user is a `"VIEWER"` or has no administrative privileges. |
| `isManagerOrAdmin` | `boolean` | `true` if the user is either an `"ADMIN"` or a `"MANAGER"`. |
| `approvedAreaIds` | `string[]` | Array of area IDs for which the user's status is `'approved'`. |
| `isSuperAdmin` | `boolean` | `true` if the user is both an `"ADMIN"` and has access to the `"ALL"` area. |

### Usage Example

```tsx
"use client";

import { useAuth } from "~/app/_hooks/useAuth";

export default function AdminFeature() {
  const { user, isAdmin, isSuperAdmin, approvedAreaIds, isLoading } = useAuth();

  if (!user) return <p>Please sign in to access this feature.</p>;
  if (isLoading) return <p>Checking permissions...</p>;

  return (
    <div className="p-4 border rounded-xl bg-card">
      <h3 className="font-bold">Welcome, {user.name}</h3>
      <p>Role: {user.role}</p>
      
      {isSuperAdmin && <p className="text-destructive font-semibold">Super Admin Permissions Active</p>}
      {isAdmin && <p className="text-primary font-semibold">Admin Panel Access Approved</p>}
      
      <div className="mt-2 text-sm text-muted-foreground">
        <strong>Approved Area IDs:</strong> {approvedAreaIds.join(", ") || "None"}
      </div>
    </div>
  );
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
