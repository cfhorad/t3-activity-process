import { sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { googleSheetConfig, googleSheetData } from "~/server/db/schema";
import { googleSheetService } from "~/server/services/googleSheet";

export const googleSheetRouter = createTRPCRouter({
	sync: publicProcedure.mutation(async ({ ctx }) => {
		try {
			const result = await googleSheetService.syncData(ctx.db);
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
			z
				.object({
					search: z.string().optional(),
					filters: z.record(z.array(z.string())).optional(),
				})
				.default({}),
		)
		.query(async ({ ctx, input }) => {
			const finalCondition = googleSheetService.buildFilterConditions(
				input.filters,
				input.search,
			);

			const result = await ctx.db
				.select()
				.from(googleSheetData)
				.where(finalCondition)
				.orderBy(sql`${googleSheetData.data}->>'StartAt' ASC`);

			return result;
		}),

	getColumns: publicProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(googleSheetConfig)
			.orderBy(googleSheetConfig.displayOrder);
		return result;
	}),

	getUniqueValues: publicProcedure
		.input(z.object({ columnName: z.string() }))
		.query(async ({ ctx, input }) => {
			return googleSheetService.getUniqueValues(ctx.db, input.columnName);
		}),
});
