import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
	assertCanManageArea,
	createTRPCRouter,
	managerProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import { activities, processes } from "~/server/db/schema";

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
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanManageArea(ctx.session.user.areaIds, input.areaId);

			const { sheetName, ...activityData } = input;
			const [activity] = await ctx.db
				.insert(activities)
				.values({
					...activityData,
					createdById: ctx.session.user.id,
				})
				.returning();

			if (sheetName && activity) {
				await ctx.db.insert(processes).values({
					name: activityData.name,
					activityId: activity.id,
					sheetName,
				});
			}

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
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
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

			const [activity] = await ctx.db
				.update(activities)
				.set(data)
				.where(eq(activities.id, id))
				.returning();
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
