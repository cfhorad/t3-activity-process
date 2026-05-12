import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
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
import { checkSheetService } from "~/server/services/checkSheet";

export const checkSheetRouter = createTRPCRouter({
	sync: managerProcedure
		.input(z.object({ processId: z.number() }))
		.mutation(async ({ ctx, input }) => {
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

			try {
				const result = await checkSheetService.syncData(
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
				console.error("Check Sheet Sync Error:", error);
				const err = error as { message?: string };
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to sync check sheet: ${err.message ?? "Unknown error"}`,
					cause: error,
				});
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
			return checkSheetService.getUniqueValues(
				ctx.db,
				input.columnName,
				input.processId,
			);
		}),

	updateCheckbox: managerProcedure
		.input(
			z.object({
				databaseId: z.number(),
				columnName: z.string(),
				newValue: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return checkSheetService.updateCheckboxState(
				ctx.db,
				input.databaseId,
				input.columnName,
				input.newValue,
			);
		}),
});
