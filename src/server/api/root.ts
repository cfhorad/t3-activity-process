import { activityRouter } from "~/server/api/routers/activity";
import { adminRouter } from "~/server/api/routers/admin";
import { checkSheetRouter } from "~/server/api/routers/checkSheet";
import { googleSheetRouter } from "~/server/api/routers/googleSheet";
import { processRouter } from "~/server/api/routers/process";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	activity: activityRouter,
	admin: adminRouter,
	googleSheet: googleSheetRouter,
	process: processRouter,
	checkSheet: checkSheetRouter,
	user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
