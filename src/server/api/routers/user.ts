import { TRPCError } from "@trpc/server";
import { and, eq, notInArray } from "drizzle-orm";
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

			const userId = session.user.id;
			const targetAreaIds = input.areaIds;

			await ctx.db.transaction(async (tx) => {
				// 1. Delete applications that are NOT in targetAreaIds
				await tx
					.delete(userAreas)
					.where(
						and(
							eq(userAreas.userId, userId),
							notInArray(userAreas.areaId, targetAreaIds),
						),
					);

				// 2. Insert new applications that don't exist yet
				const existing = await tx
					.select()
					.from(userAreas)
					.where(eq(userAreas.userId, userId));

				const existingSet = new Set(existing.map((e) => e.areaId));
				const toInsert = targetAreaIds.filter((id) => !existingSet.has(id));

				if (toInsert.length > 0) {
					await tx.insert(userAreas).values(
						toInsert.map((areaId) => ({
							userId,
							areaId,
							status: "pending" as const,
						})),
					);
				}
			});
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
