import { and, or, type SQL, sql } from "drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { env } from "~/env";
import type { db as database } from "~/server/db";
import { googleSheetConfig, googleSheetData } from "~/server/db/schema";

export type DB = typeof database;

export const googleSheetService = {
	/**
	 * Synchronize database with Google Sheets data
	 */
	async syncData(db: DB) {
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

		// Load headers from index 2 (row 3)
		await sheet.loadHeaderRow(3);
		const allRows = await sheet.getRows();

		// Load control rows (A1:Z2)
		await sheet.loadCells("A1:Z2");

		const inclusionMap: Record<string, string> = {};
		const filterableMap: Record<string, string> = {};

		sheet.headerValues.forEach((header, colIndex) => {
			inclusionMap[header] = sheet.getCell(0, colIndex).value?.toString() ?? "";
			filterableMap[header] =
				sheet.getCell(1, colIndex).value?.toString() ?? "";
		});

		const includedColumns = Object.keys(inclusionMap).filter(
			(key) => inclusionMap[key]?.toLowerCase() === "true",
		);

		const configToSave = includedColumns.map((col, index) => ({
			columnName: col,
			isFilterable: filterableMap[col]?.toLowerCase() === "true",
			displayOrder: index,
		}));

		const dataToSave = allRows.map((row) => {
			const fullObj = row.toObject();
			const filteredObj: Record<string, string> = {};

			for (const col of includedColumns) {
				let val = fullObj[col] ?? "";
				if (typeof val === "string") {
					val = val.replace(/\r\n/g, "\n").trim();
				}
				filteredObj[col] = val;
			}

			return {
				data: filteredObj,
			};
		});

		await db.transaction(async (tx) => {
			await tx.delete(googleSheetData);
			await tx.delete(googleSheetConfig);

			if (configToSave.length > 0) {
				await tx.insert(googleSheetConfig).values(configToSave);
			}

			if (dataToSave.length > 0) {
				await tx.insert(googleSheetData).values(dataToSave);
			}
		});

		return {
			rowCount: dataToSave.length,
			colCount: includedColumns.length,
		};
	},

	/**
	 * Build filter conditions for Drizzle SQL
	 */
	buildFilterConditions(
		filters?: Record<string, string[]>,
		search?: string,
	): SQL | undefined {
		const filterConditions: SQL[] = [];

		if (filters) {
			for (const [col, values] of Object.entries(filters)) {
				if (values.length > 0) {
					const colFilterConditions = values.map((val) => {
						return sql`regexp_split_to_array(${googleSheetData.data}->>${col}, '[,\n\r]+') && ARRAY[${val}]::text[]`;
					});

					const allCondition = sql`EXISTS (
						SELECT 1 FROM unnest(regexp_split_to_array(${googleSheetData.data}->>${col}, '[,\n\r]+')) as x 
						WHERE lower(trim(x)) = 'all'
					)`;

					const colFilterCondition = or(...colFilterConditions, allCondition);
					if (colFilterCondition) {
						filterConditions.push(colFilterCondition);
					}
				}
			}
		}

		const filterPart =
			filterConditions.length > 0 ? and(...filterConditions) : undefined;

		const searchCondition = search
			? sql`${googleSheetData.data}::text ILIKE ${`%${search}%`}`
			: undefined;

		return and(searchCondition, filterPart);
	},

	/**
	 * Get unique values for a specific column to populate filters
	 */
	async getUniqueValues(db: DB, columnName: string): Promise<string[]> {
		const result = await db.execute<{ value: string | null }>(
			sql`SELECT ${googleSheetData.data}->>${columnName} as value 
          FROM ${googleSheetData} 
          WHERE ${googleSheetData.data}->>${columnName} IS NOT NULL`,
		);

		const uniqueValues = new Set<string>();
		for (const row of result) {
			if (row.value) {
				const parts = row.value.split(/[,\n\r]+/).map((p) => p.trim());
				for (const p of parts) {
					if (p && p.toLowerCase() !== "all") {
						uniqueValues.add(p);
					}
				}
			}
		}

		return Array.from(uniqueValues).sort();
	},
};
