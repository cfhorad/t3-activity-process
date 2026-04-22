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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
