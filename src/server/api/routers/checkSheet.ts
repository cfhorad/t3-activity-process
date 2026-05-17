import { TRPCError } from "@trpc/server";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	managerProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	googleSheetConfig,
	googleSheetData,
	processes,
} from "~/server/db/schema";
import { checkSheetService } from "~/server/services/checkSheet";

export const checkSheetRouter = createTRPCRouter({
	sync: managerProcedure
		.input(z.object({ processId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.processId),
				with: {
					activity: true,
				},
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaId === "ALL" || process.activity.areaId === areaId);

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限同步此數據（僅限活動建立者或該區管理員）。",
				});
			}

			try {
				const result = await checkSheetService.syncData(
					ctx.db,
					process.id,
					process.activity.googleSheetId,
					process.sheetName,
				);
				return { success: true, ...result };
			} catch (error) {
				console.error("Check Sheet Sync Error:", error);
				const err = error as { message?: string };
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `同步失敗: ${err.message ?? "未知錯誤"}`,
					cause: error,
				});
			}
		}),

	getAll: protectedProcedure
		.input(
			z.object({
				processId: z.number(),
				search: z.string().optional(),
				filters: z.record(z.array(z.string())).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.processId),
				with: { activity: true },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			if (areaId !== "ALL" && process.activity.areaId !== areaId) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			const finalCondition = checkSheetService.buildFilterConditions(
				input.filters,
				input.search,
				input.processId,
			);

			const result = await ctx.db
				.select()
				.from(googleSheetData)
				.where(finalCondition);

			return result;
		}),

	getColumns: protectedProcedure
		.input(z.object({ processId: z.number() }))
		.query(async ({ ctx, input }) => {
			const { areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.processId),
				with: { activity: true },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			if (areaId !== "ALL" && process.activity.areaId !== areaId) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			const result = await ctx.db
				.select()
				.from(googleSheetConfig)
				.where(eq(googleSheetConfig.processId, input.processId))
				.orderBy(googleSheetConfig.displayOrder);
			return result;
		}),

	getUniqueValues: protectedProcedure
		.input(z.object({ processId: z.number(), columnName: z.string() }))
		.query(async ({ ctx, input }) => {
			const { areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.processId),
				with: { activity: true },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			if (areaId !== "ALL" && process.activity.areaId !== areaId) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			return checkSheetService.getUniqueValues(
				ctx.db,
				input.columnName,
				input.processId,
			);
		}),

	updateCheckbox: protectedProcedure
		.input(
			z.object({
				databaseId: z.number(),
				columnName: z.string(),
				newValue: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaId } = ctx.session.user;

			// Need to find the activity associated with this data point
			const data = await ctx.db.query.googleSheetData.findFirst({
				where: eq(googleSheetData.id, input.databaseId),
				with: {
					process: {
						with: { activity: { with: { leaders: true } } },
					},
				},
			});

			if (!data) throw new TRPCError({ code: "NOT_FOUND" });

			const activity = data.process.activity;
			const isCreator = activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" && (areaId === "ALL" || activity.areaId === areaId);
			const isLeader = activity.leaders.some(
				(l: { userId: string }) => l.userId === userId,
			);

			if (!isCreator && !isAreaAdmin && !isLeader) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限編輯此活動的核取方塊數據。",
				});
			}

			return checkSheetService.updateCheckboxState(
				ctx.db,
				input.databaseId,
				input.columnName,
				input.newValue,
			);
		}),

	updateVisibleColumns: managerProcedure
		.input(
			z.object({
				processId: z.number(),
				visibleColumnNames: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.processId),
				with: { activity: true },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaId === "ALL" || process.activity.areaId === areaId);

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限編輯欄位可見性（僅限建立者或該區管理員）。",
				});
			}

			await ctx.db.transaction(async (tx) => {
				if (input.visibleColumnNames.length > 0) {
					await tx
						.update(googleSheetConfig)
						.set({ isVisible: true })
						.where(
							and(
								eq(googleSheetConfig.processId, input.processId),
								inArray(googleSheetConfig.columnName, input.visibleColumnNames),
							),
						);

					await tx
						.update(googleSheetConfig)
						.set({ isVisible: false })
						.where(
							and(
								eq(googleSheetConfig.processId, input.processId),
								notInArray(
									googleSheetConfig.columnName,
									input.visibleColumnNames,
								),
							),
						);
				} else {
					await tx
						.update(googleSheetConfig)
						.set({ isVisible: false })
						.where(eq(googleSheetConfig.processId, input.processId));
				}
			});
			return { success: true };
		}),
});
