import { and, eq, or, type SQL, sql } from "drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { googleSheetConfig, googleSheetData } from "~/server/db/schema";

export const googleSheetRouter = createTRPCRouter({
	sync: publicProcedure.mutation(async ({ ctx }) => {
		try {
			const jwt = new JWT({
				email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
				key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
				scopes: ["https://www.googleapis.com/auth/spreadsheets"],
			});

			const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, jwt);
			await doc.loadInfo();
			const sheet = doc.sheetsByTitle[env.GOOGLE_SHEET_PROCESS_NAME];
			if (!sheet) {
				throw new Error(
					`Sheet named "${env.GOOGLE_SHEET_PROCESS_NAME}" not found in the Google Spreadsheet.`,
				);
			}
			// Load headers from index 2 (the row with "StartAt", "EndAt", etc.)
			await sheet.loadHeaderRow(3); // row 3 is index 2
			const allRows = await sheet.getRows();

			// We need at least the control rows (0, 1), header row (2), and 1 data row (3+)
			// allRows starts from index 3 in the sheet.
			if (allRows.length === 0) {
				// No data rows found
			}

			// Now allRows[0] is index 3 in the sheet (the first actual data row).
			// We still need the control rows at index 0 and 1.
			// We can use loadCells for those.
			await sheet.loadCells("A1:Z2");

			const inclusionMap: Record<string, string> = {};
			const filterableMap: Record<string, string> = {};

			sheet.headerValues.forEach((header, colIndex) => {
				inclusionMap[header] =
					sheet.getCell(0, colIndex).value?.toString() ?? "";
				filterableMap[header] =
					sheet.getCell(1, colIndex).value?.toString() ?? "";
			});

			// Columns to include are those where the first control row is "true"
			const includedColumns = Object.keys(inclusionMap).filter(
				(key) => inclusionMap[key]?.toLowerCase() === "true",
			);

			// Configuration for UI filters
			const configToSave = includedColumns.map((col, index) => ({
				columnName: col,
				isFilterable: filterableMap[col]?.toLowerCase() === "true",
				displayOrder: index,
			}));

			// Data Rows (start from allRows[0] which is index 3 in sheet)
			const dataToSave = allRows.map((row) => {
				const fullObj = row.toObject();
				const filteredObj: Record<string, string> = {};
				let isAlwaysShow = false;

				for (const col of includedColumns) {
					let val = fullObj[col] ?? "";
					if (typeof val === "string") {
						val = val.replace(/\r\n/g, "\n").trim();
						if (val.toLowerCase() === "all") {
							isAlwaysShow = true;
						}
					}
					filteredObj[col] = val;
				}

				return {
					data: filteredObj,
					isAlwaysShow,
				};
			});

			// Delete old data and config
			await ctx.db.transaction(async (tx) => {
				await tx.delete(googleSheetData);
				await tx.delete(googleSheetConfig);

				// Insert new config
				if (configToSave.length > 0) {
					await tx.insert(googleSheetConfig).values(configToSave);
				}

				// Insert new data
				if (dataToSave.length > 0) {
					await tx.insert(googleSheetData).values(dataToSave);
				}
			});

			return {
				success: true,
				rowCount: dataToSave.length,
				colCount: includedColumns.length,
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
			const filterConditions: SQL[] = [];

			// Handle multi-select filters
			if (input.filters) {
				for (const [col, values] of Object.entries(input.filters)) {
					if (values.length > 0) {
						const colFilterConditions = values.map((val) => {
							// Split by comma or line break only, not whitespace
							return sql`regexp_split_to_array(${googleSheetData.data}->>${col}, '[,\n\r]+') && ARRAY[${val}]::text[]`;
						});
						const colFilterCondition = or(...colFilterConditions);
						if (colFilterCondition) {
							filterConditions.push(colFilterCondition);
						}
					}
				}
			}

			// Base filter logic: (All Filters Match) OR isAlwaysShow
			const filterPart =
				filterConditions.length > 0
					? or(and(...filterConditions), eq(googleSheetData.isAlwaysShow, true))
					: null;

			// Handle global search independently
			const searchCondition = input.search
				? sql`${googleSheetData.data}::text ILIKE ${`%${input.search}%`}`
				: null;

			// Combine search and filters
			const finalCondition = and(
				searchCondition ?? undefined,
				filterPart ?? undefined,
			);

			const result = await ctx.db
				.select()
				.from(googleSheetData)
				.where(finalCondition);

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
			// Get all raw values for the column
			const result = await ctx.db.execute<{ value: string | null }>(
				sql`SELECT ${googleSheetData.data}->>${input.columnName} as value 
            FROM ${googleSheetData} 
            WHERE ${googleSheetData.data}->>${input.columnName} IS NOT NULL`,
			);

			const uniqueValues = new Set<string>();
			for (const row of result) {
				if (row.value) {
					// Split by comma or line break only
					const parts = row.value.split(/[,\n\r]+/).map((p) => p.trim());
					for (const p of parts) {
						if (p && p.toLowerCase() !== "all") {
							uniqueValues.add(p);
						}
					}
				}
			}

			return Array.from(uniqueValues).sort();
		}),
});
