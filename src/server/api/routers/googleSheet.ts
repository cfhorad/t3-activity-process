import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
	activities,
	googleSheetConfig,
	googleSheetData,
} from "~/server/db/schema";
import { googleSheetService } from "~/server/services/googleSheet";

export const googleSheetRouter = createTRPCRouter({
	sync: publicProcedure
		.input(z.object({ activityId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const [activity] = await ctx.db
					.select()
					.from(activities)
					.where(eq(activities.id, input.activityId));

				if (!activity) {
					throw new Error("Activity not found");
				}

				if (!activity.googleSheetId || !activity.googleSheetName) {
					throw new Error("Activity does not have a Google Sheet configured");
				}

				const result = await googleSheetService.syncData(ctx.db, {
					activityId: activity.id,
					googleSheetId: activity.googleSheetId,
					googleSheetName: activity.googleSheetName,
					handlingMode: activity.handlingMode ?? "simple display",
				});

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
				activityId: z.string(),
				search: z.string().optional(),
				filters: z.record(z.array(z.string())).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const finalCondition = googleSheetService.buildFilterConditions(
				input.activityId,
				input.filters,
				input.search,
			);

			const result = await ctx.db
				.select()
				.from(googleSheetData)
				.where(finalCondition)
				.orderBy(googleSheetData.rowOrder);

			return result;
		}),

	getColumns: publicProcedure
		.input(z.object({ activityId: z.string() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db
				.select()
				.from(googleSheetConfig)
				.where(eq(googleSheetConfig.activityId, input.activityId))
				.orderBy(googleSheetConfig.displayOrder);
			return result;
		}),

	getUniqueValues: publicProcedure
		.input(z.object({ activityId: z.string(), columnName: z.string() }))
		.query(async ({ ctx, input }) => {
			return googleSheetService.getUniqueValues(
				ctx.db,
				input.activityId,
				input.columnName,
			);
		}),

	getColumnsPreview: publicProcedure
		.input(
			z.object({
				googleSheetId: z.string(),
				googleSheetName: z.string(),
				handlingMode: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return googleSheetService.getColumnsPreview(input);
		}),
});
