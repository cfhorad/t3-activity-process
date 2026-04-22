import { type SQL, sql } from "drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { googleSheetData } from "~/server/db/schema";

export const googleSheetRouter = createTRPCRouter({
	sync: publicProcedure.mutation(async ({ ctx }) => {
		try {
			const jwt = new JWT({
				email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
				key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
				scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
			});

			const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, jwt);
			await doc.loadInfo();
			const sheet = doc.sheetsByTitle.test;
			if (!sheet) {
				throw new Error(
					'Sheet named "test" not found in the Google Spreadsheet.',
				);
			}
			const rows = await sheet.getRows();

			const dataToSave = rows.map((row) => row.toObject());

			// Delete old data as requested
			await ctx.db.delete(googleSheetData);

			// Insert new data
			if (dataToSave.length > 0) {
				await ctx.db.insert(googleSheetData).values(
					dataToSave.map((data) => ({
						data,
					})),
				);
			}

			return { success: true, count: dataToSave.length };
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
					filterColumn: z.string().optional(),
				})
				.default({}),
		)
		.query(async ({ ctx, input }) => {
			let conditions: SQL | undefined;

			if (input.search) {
				if (input.filterColumn && input.filterColumn !== "all") {
					// Filter by specific JSONB key
					conditions = sql`${googleSheetData.data}->>${input.filterColumn} ILIKE ${`%${input.search}%`}`;
				} else {
					// Global search across all values
					conditions = sql`${googleSheetData.data}::text ILIKE ${`%${input.search}%`}`;
				}
			}

			return await ctx.db
				.select()
				.from(googleSheetData)
				.where(conditions);
		}),

	getColumns: publicProcedure.query(async ({ ctx }) => {
		// Get unique keys from JSONB data
		const result = await ctx.db.execute<{ column_name: string }>(
			sql`SELECT DISTINCT jsonb_object_keys(${googleSheetData.data}) as column_name FROM ${googleSheetData}`,
		);
		return result.map((row) => row.column_name);
	}),
});


