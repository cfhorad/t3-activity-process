import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	managerProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import {
	googleSheetConfig,
	googleSheetData,
	processes,
} from "~/server/db/schema";
import { googleSheetService } from "~/server/services/googleSheet";

export const googleSheetRouter = createTRPCRouter({
	sync: managerProcedure
		.input(z.object({ processId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaIds } = ctx.session.user;
			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.processId),
				with: {
					activity: true,
				},
			});

			if (!process) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Process not found",
				});
			}

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(process.activity.areaId !== null &&
						areaIds.includes(process.activity.areaId)));

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限同步此數據（僅限活動建立者或該區管理員）。",
				});
			}

			try {
				const result = await googleSheetService.syncData(
					ctx.db,
					process.id,
					process.activity.googleSheetId,
					process.sheetName,
				);
				return {
					success: true,
					...result,
				};
			} catch (error) {
				console.error("Google Sheet Sync Error:", error);
				const err = error as { message?: string };
				throw new Error(
					`Failed to sync google sheet: ${err.message ?? "Unknown error"}`,
				);
			}
		}),

	getAll: publicProcedure
		.input(
			z.object({
				processId: z.number(),
				search: z.string().optional(),
				filters: z.record(z.array(z.string())).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const finalCondition = googleSheetService.buildFilterConditions(
				input.filters,
				input.search,
				input.processId,
			);

			const result = await ctx.db
				.select()
				.from(googleSheetData)
				.where(finalCondition)
				.orderBy(sql`${googleSheetData.data}->>'StartAt' ASC`);

			return result;
		}),

	getColumns: publicProcedure
		.input(z.object({ processId: z.number() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(googleSheetConfig)
				.where(eq(googleSheetConfig.processId, input.processId))
				.orderBy(googleSheetConfig.displayOrder);
			return result;
		}),

	getUniqueValues: publicProcedure
		.input(z.object({ processId: z.number(), columnName: z.string() }))
		.query(async ({ ctx, input }) => {
			return googleSheetService.getUniqueValues(
				ctx.db,
				input.columnName,
				input.processId,
			);
		}),

	getSheetMetadata: managerProcedure
		.input(z.object({ spreadsheetId: z.string().min(1) }))
		.query(async ({ input }) => {
			return googleSheetService.getSheetMetadata(input.spreadsheetId);
		}),
});
