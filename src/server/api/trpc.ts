/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/better-auth";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
	const session = await auth.api.getSession({
		headers: opts.headers,
	});
	return {
		db,
		session,
		...opts,
	};
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

	return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(async ({ ctx, next }) => {
		if (!ctx.session?.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		const user = ctx.session.user;

		// Gate 1: account suspended
		if (user.status === "suspended") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "ACCOUNT_SUSPENDED",
			});
		}

		// Load ONLY approved areas (pending/rejected areas are invisible to queries)
		const userAreaRows = await ctx.db.query.userAreas.findMany({
			where: (ua, { and, eq }) =>
				and(eq(ua.userId, user.id), eq(ua.status, "approved")),
			columns: { areaId: true },
		});
		const areaIds = userAreaRows.map((r) => r.areaId);

		// Gate 2: no approved areas yet → pending approval
		if (areaIds.length === 0) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "PENDING_APPROVAL",
			});
		}

		return next({
			ctx: {
				session: {
					...ctx.session,
					user: {
						...user,
						areaIds,
						role: user.role as "ADMIN" | "MANAGER" | "VIEWER",
					},
				},
			},
		});
	});

// Helper function to assert a manager or admin can manage a target area
export function assertCanManageArea(
	approverAreaIds: string[],
	targetAreaId: string,
) {
	if (
		!approverAreaIds.includes("ALL") &&
		!approverAreaIds.includes(targetAreaId)
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "您沒有管理此分會的權限",
		});
	}
}

/**
 * Manager procedure (ADMIN or MANAGER)
 */
export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
	const role = ctx.session.user.role;
	if (role !== "ADMIN" && role !== "MANAGER") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "您沒有足夠的權限執行此操作（需要管理員或經理角色）。",
		});
	}
	return next();
});

/**
 * Admin procedure (ADMIN only)
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	const role = ctx.session.user.role;
	if (role !== "ADMIN") {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next();
});
