import { eq } from "drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { z } from "zod";
import { env } from "~/env";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { activities } from "~/server/db/schema";
import { googleSheetService } from "~/server/services/googleSheet";

export const activityRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select()
			.from(activities)
			.orderBy(activities.createdAt);

		return result ?? [];
	}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [activity] = await ctx.db
				.select()
				.from(activities)
				.where(eq(activities.id, input.id));

			if (!activity) {
				throw new Error("Activity not found");
			}

			return activity;
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				date: z.string().min(1),
				memo: z.string().optional(),
				googleSheetId: z.string().optional(),
				googleSheetName: z.string().optional(),
				handlingMode: z.string().default("simple display"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [activity] = await ctx.db
				.insert(activities)
				.values({
					name: input.name,
					date: input.date,
					memo: input.memo,
					googleSheetId: input.googleSheetId,
					googleSheetName: input.googleSheetName,
					handlingMode: input.handlingMode,
					createdById: ctx.session.user.id,
				})
				.returning();

			if (!activity) {
				throw new Error("Failed to create activity");
			}

			if (input.googleSheetId && input.googleSheetName) {
				try {
					await googleSheetService.syncData(ctx.db, {
						activityId: activity.id,
						googleSheetId: input.googleSheetId,
						googleSheetName: input.googleSheetName,
						handlingMode: input.handlingMode,
					});
				} catch (err) {
					console.error("Auto-sync failed on create:", err);
				}
			}

			return activity;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				date: z.string().min(1),
				memo: z.string().optional(),
				googleSheetId: z.string().optional(),
				googleSheetName: z.string().optional(),
				handlingMode: z.string().default("simple display"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [activity] = await ctx.db
				.update(activities)
				.set({
					name: input.name,
					date: input.date,
					memo: input.memo,
					googleSheetId: input.googleSheetId,
					googleSheetName: input.googleSheetName,
					handlingMode: input.handlingMode,
				})
				.where(eq(activities.id, input.id))
				.returning();

			if (!activity) {
				throw new Error("Failed to update activity");
			}

			if (input.googleSheetId && input.googleSheetName) {
				try {
					await googleSheetService.syncData(ctx.db, {
						activityId: activity.id,
						googleSheetId: input.googleSheetId,
						googleSheetName: input.googleSheetName,
						handlingMode: input.handlingMode,
					});
				} catch (err) {
					console.error("Auto-sync failed on update:", err);
				}
			}

			return activity;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(activities).where(eq(activities.id, input.id));
			return { success: true };
		}),

	getGoogleSheetTabs: protectedProcedure
		.input(z.object({ googleSheetId: z.string().min(1) }))
		.query(async ({ input }) => {
			try {
				const jwt = new JWT({
					email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
					key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
					scopes: ["https://www.googleapis.com/auth/spreadsheets"],
				});

				const doc = new GoogleSpreadsheet(input.googleSheetId, jwt);
				await doc.loadInfo();

				const sheets = Object.values(doc.sheetsById).map((sheet) => ({
					id: sheet.sheetId,
					title: sheet.title,
				}));

				return sheets;
			} catch (error) {
				console.error("Failed to load Google Sheet tabs", error);
				throw new Error(
					"Failed to load Google Sheet tabs. Please check the ID and permissions.",
				);
			}
		}),
});
