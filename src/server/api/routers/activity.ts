import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
	assertCanManageArea,
	createTRPCRouter,
	managerProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	getCachedActivities,
	getCachedActivityById,
} from "~/server/cache/activity";
import { activities, activityEditors, processes } from "~/server/db/schema";

export const activityRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const { areaIds } = ctx.session.user;
		const areaIdsJoined = [...areaIds].sort().join(",");
		return await getCachedActivities(areaIdsJoined);
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const { areaIds } = ctx.session.user;

			const activity = await getCachedActivityById(input.id);

			if (!activity) return null;

			// Verify authorization (area access)
			if (
				!areaIds.includes("ALL") &&
				!(activity.areaId !== null && areaIds.includes(activity.areaId))
			) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

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
				editorUserIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanManageArea(ctx.session.user.areaIds, input.areaId);

			const { sheetName, editorUserIds, ...activityData } = input;

			const activity = await ctx.db.transaction(async (tx) => {
				const [newActivity] = await tx
					.insert(activities)
					.values({
						...activityData,
						createdById: ctx.session.user.id,
					})
					.returning();

				if (newActivity && editorUserIds && editorUserIds.length > 0) {
					await tx.insert(activityEditors).values(
						editorUserIds.map((userId) => ({
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

			if (activity) {
				revalidateTag("activities");
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
				areaId: z.string().min(1),
				editorUserIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, editorUserIds, ...data } = input;
			const { id: userId, role, areaIds } = ctx.session.user;

			// Fetch activity to check ownership/area
			const existing = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, id),
				with: { editors: true },
			});

			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = existing.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(existing.areaId !== null && areaIds.includes(existing.areaId)));
			const isEditor = existing.editors.some((e) => e.userId === userId);

			if (!isCreator && !isAreaAdmin && !isEditor) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"您沒有權限編輯此活動（僅限建立者、協同編輯者或該區管理員）。",
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
					.delete(activityEditors)
					.where(eq(activityEditors.activityId, id));

				if (editorUserIds && editorUserIds.length > 0) {
					await tx.insert(activityEditors).values(
						editorUserIds.map((userId) => ({
							activityId: id,
							userId,
						})),
					);
				}

				return [updated];
			});

			if (activity) {
				revalidateTag("activities");
				revalidateTag(`activity-${id}`);
			}

			return activity;
		}),

	delete: managerProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaIds } = ctx.session.user;

			const existing = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, input.id),
				with: { editors: true },
			});

			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = existing.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(existing.areaId !== null && areaIds.includes(existing.areaId)));
			const isEditor = existing.editors.some((e) => e.userId === userId);

			if (!isCreator && !isAreaAdmin && !isEditor) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"您沒有權限刪除此活動（僅限建立者、協同編輯者或該區管理員）。",
				});
			}

			await ctx.db.delete(activities).where(eq(activities.id, input.id));
			revalidateTag("activities");
			revalidateTag(`activity-${input.id}`);
			return { success: true };
		}),
});
