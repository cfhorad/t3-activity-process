import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
	assertCanManageArea,
	createTRPCRouter,
	managerProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import { activities, activityLeaders, processes } from "~/server/db/schema";

export const activityRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const { areaIds } = ctx.session.user;
		const where = areaIds.includes("ALL")
			? undefined
			: inArray(activities.areaId, areaIds);

		return await ctx.db.query.activities.findMany({
			where,
			with: {
				creator: true,
				processes: true,
				area: true,
				leaders: {
					with: {
						user: true,
					},
				},
			},
			orderBy: (activities, { desc }) => [desc(activities.createdAt)],
		});
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const { areaIds } = ctx.session.user;

			const activity = await ctx.db.query.activities.findFirst({
				where: (activities, { and, eq, inArray }) =>
					areaIds.includes("ALL")
						? eq(activities.id, input.id)
						: and(
								eq(activities.id, input.id),
								inArray(activities.areaId, areaIds),
							),
				with: {
					processes: true,
					creator: true,
					area: true,
					leaders: {
						with: {
							user: true,
						},
					},
				},
			});
			return activity;
		}),

	create: managerProcedure
		.input(
			z.object({
				name: z.string().min(1),
				googleSheetId: z.string().min(1),
				activityDate: z.string().min(1),
				activityMemo: z.string().optional().nullable(),
				sheetName: z.string().optional(),
				areaId: z.string().min(1),
				leaderUserIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanManageArea(ctx.session.user.areaIds, input.areaId);

			const { sheetName, leaderUserIds, ...activityData } = input;

			const activity = await ctx.db.transaction(async (tx) => {
				const [newActivity] = await tx
					.insert(activities)
					.values({
						...activityData,
						createdById: ctx.session.user.id,
					})
					.returning();

				if (newActivity && leaderUserIds && leaderUserIds.length > 0) {
					await tx.insert(activityLeaders).values(
						leaderUserIds.map((userId) => ({
							activityId: newActivity.id,
							userId,
						})),
					);
				}

				if (sheetName && newActivity) {
					await tx.insert(processes).values({
						name: activityData.name,
						activityId: newActivity.id,
						sheetName,
					});
				}

				return newActivity;
			});

			return activity;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1),
				googleSheetId: z.string().min(1),
				activityDate: z.string().min(1),
				activityMemo: z.string().optional().nullable(),
				areaId: z.string().min(1),
				leaderUserIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, leaderUserIds, ...data } = input;
			const { id: userId, role, areaIds } = ctx.session.user;

			// Fetch activity to check ownership/area
			const existing = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, id),
			});

			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = existing.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(existing.areaId !== null && areaIds.includes(existing.areaId)));

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限編輯此活動（僅限建立者或該區管理員）。",
				});
			}

			// Verify they also have permission to manage the new area they are assigning it to
			assertCanManageArea(areaIds, input.areaId);

			const [activity] = await ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(activities)
					.set(data)
					.where(eq(activities.id, id))
					.returning();

				await tx
					.delete(activityLeaders)
					.where(eq(activityLeaders.activityId, id));

				if (leaderUserIds && leaderUserIds.length > 0) {
					await tx.insert(activityLeaders).values(
						leaderUserIds.map((userId) => ({
							activityId: id,
							userId,
						})),
					);
				}

				return [updated];
			});

			return activity;
		}),

	delete: managerProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaIds } = ctx.session.user;

			const existing = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, input.id),
			});

			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = existing.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(existing.areaId !== null && areaIds.includes(existing.areaId)));

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限刪除此活動（僅限建立者或該區管理員）。",
				});
			}

			await ctx.db.delete(activities).where(eq(activities.id, input.id));
			return { success: true };
		}),
});
