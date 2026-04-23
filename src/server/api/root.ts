import { activityRouter } from "~/server/api/routers/activity";
import { googleSheetRouter } from "~/server/api/routers/googleSheet";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	activity: activityRouter,
	googleSheet: googleSheetRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.activity.getAll();
 *       ^? Activity[]
 */
export const createCaller = createCallerFactory(appRouter);
