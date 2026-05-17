import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { auth } from "~/server/better-auth";
import { userAreas } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
	// Anyone can call this (for registration)
	getPublicAreas: publicProcedure.query(async ({ ctx }) => {
		return ctx.db.query.area.findMany({
			where: (a, { ne }) => ne(a.id, "ALL"), // hide "ALL" from registration
		});
	}),

	// Called right after signup — creates pending userAreas
	applyToAreas: publicProcedure
		.input(z.object({ areaIds: z.array(z.string()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			const session = await auth.api.getSession({ headers: ctx.headers });
			if (!session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });

			await ctx.db
				.insert(userAreas)
				.values(
					input.areaIds.map((areaId) => ({
						userId: session.user.id,
						areaId,
						status: "pending" as const,
					})),
				)
				.onConflictDoNothing();
		}),

	// For logged-in users to apply for additional areas
	requestMoreAreas: protectedProcedure
		.input(z.object({ areaIds: z.array(z.string()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.insert(userAreas)
				.values(
					input.areaIds.map((areaId) => ({
						userId: ctx.session.user.id,
						areaId,
						status: "pending" as const,
					})),
				)
				.onConflictDoNothing(); // skip already-existing rows
		}),

	// Get current user's area statuses (for /pending-approval page)
	getMyAreaStatuses: publicProcedure.query(async ({ ctx }) => {
		const session = await auth.api.getSession({ headers: ctx.headers });
		if (!session?.user) return [];
		return ctx.db.query.userAreas.findMany({
			where: (ua, { eq }) => eq(ua.userId, session.user.id),
			with: { area: true },
		});
	}),
});
