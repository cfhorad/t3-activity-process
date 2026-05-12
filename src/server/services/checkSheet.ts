import { and, eq, or, type SQL, sql } from "drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { env } from "~/env";
import type { db as database } from "~/server/db";
import { googleSheetConfig, googleSheetData } from "~/server/db/schema";

export type DB = typeof database;

export const checkSheetService = {
	/**
	 * Synchronize database with Google Sheets data for Check-in Lists
	 * Row 1: isCheckbox
	 * Row 2: isFilterable
	 * Row 3: Headers
	 */
	async syncData(
		db: DB,
		processId: number,
		spreadsheetId: string,
		sheetName: string,
	) {
		const jwt = new JWT({
			email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});

		const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
		await doc.loadInfo();
		const sheet = doc.sheetsByTitle[sheetName];

		if (!sheet) {
			throw new Error(
				`Sheet named "${sheetName}" not found in the Google Spreadsheet.`,
			);
		}

		if (sheet.rowCount < 3) {
			throw new Error(
				"The sheet must have at least 3 rows to be used as a Check-in List (Row 1: Checkbox Flags, Row 2: Filter Flags, Row 3: Headers).",
			);
		}

		// Load headers and control rows (Rows 1-3)
		await sheet.loadCells({
			startRowIndex: 0,
			endRowIndex: 3,
			startColumnIndex: 0,
			endColumnIndex: sheet.columnCount,
		});

		// Manually extract headers from Row 3 (index 2)
		const headers: string[] = [];
		const checkboxFlags: boolean[] = [];
		const filterableFlags: boolean[] = [];

		for (let i = 0; i < sheet.columnCount; i++) {
			const headerValue = sheet.getCell(2, i).value?.toString() ?? "";
			if (headerValue) {
				headers.push(headerValue);
				// Check Row 1 (index 0) for checkbox flag
				checkboxFlags.push(
					sheet.getCell(0, i).value?.toString().toLowerCase() === "true",
				);
				// Check Row 2 (index 1) for filterable flag
				filterableFlags.push(
					sheet.getCell(1, i).value?.toString().toLowerCase() === "true",
				);
			} else {
				// Stop at the first empty header
				break;
			}
		}

		if (headers.length === 0) {
			throw new Error(
				"No headers found in Row 3. Please ensure Row 3 contains your column titles.",
			);
		}

		// Configure columns to save
		const configToSave = headers.map((col, index) => ({
			processId,
			columnName: col,
			isCheckbox: checkboxFlags[index] ?? false,
			isFilterable: filterableFlags[index] ?? false,
			displayOrder: index,
		}));

		// Load all data cells starting from Row 4 (index 3)
		await sheet.loadCells({
			startRowIndex: 3,
			endRowIndex: sheet.rowCount,
			startColumnIndex: 0,
			endColumnIndex: headers.length,
		});

		const dataToSave: {
			processId: number;
			data: Record<string, string | boolean>;
		}[] = [];
		// Iterate through rows starting from index 3 (Row 4)
		for (let r = 3; r < sheet.rowCount; r++) {
			const filteredObj: Record<string, string | boolean> = {};
			let hasValue = false;

			headers.forEach((col, cIndex) => {
				const cell = sheet.getCell(r, cIndex);
				const isCheckbox = checkboxFlags[cIndex];
				const val = cell.value ?? "";

				if (val !== "") hasValue = true;

				if (isCheckbox) {
					const stringVal = val.toString().toLowerCase();
					filteredObj[col] = stringVal === "true";
				} else {
					let finalVal = val.toString();
					finalVal = finalVal.replace(/\r\n/g, "\n").trim();
					filteredObj[col] = finalVal;
				}
			});

			// Only save rows that have at least one value
			if (hasValue) {
				dataToSave.push({
					processId,
					data: filteredObj,
				});
			}
		}

		await db.transaction(async (tx) => {
			await tx
				.delete(googleSheetData)
				.where(eq(googleSheetData.processId, processId));
			await tx
				.delete(googleSheetConfig)
				.where(eq(googleSheetConfig.processId, processId));

			if (configToSave.length > 0) {
				await tx.insert(googleSheetConfig).values(configToSave);
			}

			if (dataToSave.length > 0) {
				await tx.insert(googleSheetData).values(dataToSave);
			}
		});

		return {
			rowCount: dataToSave.length,
			colCount: headers.length,
		};
	},

	/**
	 * Update a specific checkbox field in the database JSONB data
	 */
	async updateCheckboxState(
		db: DB,
		databaseId: number,
		columnName: string,
		newValue: boolean,
	) {
		// Drizzle approach to update a single key in JSONB
		// We use sql operator to update the jsonb field
		await db
			.update(googleSheetData)
			.set({
				data: sql`jsonb_set(${googleSheetData.data}, ARRAY[${columnName}], ${newValue ? "true" : "false"}::jsonb)`,
			})
			.where(eq(googleSheetData.id, databaseId));

		return { success: true };
	},

	/**
	 * Build filter conditions for Drizzle SQL (similar to googleSheetService)
	 */
	buildFilterConditions(
		filters?: Record<string, string[]>,
		search?: string,
		processId?: number,
	): SQL | undefined {
		const filterConditions: SQL[] = [];

		if (processId !== undefined) {
			filterConditions.push(eq(googleSheetData.processId, processId));
		}

		if (filters) {
			for (const [col, values] of Object.entries(filters)) {
				if (values.length > 0) {
					// For Check-in lists, we handle both boolean and string filters
					// If it's a checkbox column, it's boolean in the JSON
					const colFilterConditions = values.map((val) => {
						if (val === "true" || val === "false") {
							return sql`${googleSheetData.data}->>${col} = ${val}`;
						}
						return sql`regexp_split_to_array(${googleSheetData.data}->>${col}, '[,\n\r]+') && ARRAY[${val}]::text[]`;
					});

					const colFilterCondition = or(...colFilterConditions);
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
	async getUniqueValues(
		db: DB,
		columnName: string,
		processId: number,
	): Promise<string[]> {
		const result = await db.execute<{ value: string | boolean | null }>(
			sql`SELECT ${googleSheetData.data}->>${columnName} as value 
          FROM ${googleSheetData} 
          WHERE ${googleSheetData.processId} = ${processId} AND ${googleSheetData.data}->>${columnName} IS NOT NULL`,
		);

		const uniqueValues = new Set<string>();
		for (const row of result) {
			if (row.value !== null) {
				const stringVal = row.value.toString();
				const parts = stringVal.split(/[,\n\r]+/).map((p) => p.trim());
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
