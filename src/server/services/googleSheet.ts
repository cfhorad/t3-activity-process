import { and, eq, or, type SQL, sql } from "drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { env } from "~/env";
import type { db as database } from "~/server/db";
import { activities, googleSheetData } from "~/server/db/schema";

export type DB = typeof database;
type GoogleSheetDataInsert = typeof googleSheetData.$inferInsert;

export const googleSheetService = {
	/**
	 * Deduplicate headers by appending a numeric suffix if needed
	 */
	deduplicateHeaders(headers: string[]): string[] {
		const seen = new Map<string, number>();
		return headers.map((header) => {
			const cleanHeader = header || "Column";
			if (!seen.has(cleanHeader)) {
				seen.set(cleanHeader, 1);
				return cleanHeader;
			}
			const count = seen.get(cleanHeader) ?? 1;
			seen.set(cleanHeader, count + 1);
			return `${cleanHeader}_${count}`;
		});
	},

	/**
	 * Synchronize database with Google Sheets data
	 */
	async getMetadata(params: {
		googleSheetId: string;
		googleSheetName: string;
		handlingMode?: string;
	}) {
		const isSimpleDisplay = params.handlingMode === "simple display";
		const jwt = new JWT({
			email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
			scopes: ["https://www.googleapis.com/auth/spreadsheets"],
		});

		const doc = new GoogleSpreadsheet(params.googleSheetId, jwt);
		await doc.loadInfo();
		const sheet = doc.sheetsByTitle[params.googleSheetName];

		if (!sheet) {
			throw new Error(
				`Sheet named "${params.googleSheetName}" not found in the Google Spreadsheet.`,
			);
		}

		const inclusionMap: Record<string, string> = {};
		const filterableMap: Record<string, string> = {};

		let headerValues: string[] = [];
		if (isSimpleDisplay) {
			// For simple display, headers are on row 1 (1-based index 1)
			// We load cells manually to handle deduplication of headers
			await sheet.loadCells({ startRowIndex: 0, endRowIndex: 1 });
			const rawHeaders: string[] = [];
			for (let i = 0; i < sheet.columnCount; i++) {
				const val = sheet.getCell(0, i).value?.toString()?.trim() || "";
				rawHeaders.push(val);
			}
			headerValues = this.deduplicateHeaders(rawHeaders);

			// All columns are included and none are filterable by default in simple mode
			headerValues.forEach((header) => {
				inclusionMap[header] = "true";
				filterableMap[header] = "false";
			});
		} else {
			// For process mode, headers are on row 3 (1-based index 3)
			// We load cells manually to handle deduplication of headers
			await sheet.loadCells({ startRowIndex: 0, endRowIndex: 3 });
			const rawHeaders: string[] = [];
			for (let i = 0; i < sheet.columnCount; i++) {
				const val = sheet.getCell(2, i).value?.toString()?.trim() || "";
				rawHeaders.push(val);
			}
			headerValues = this.deduplicateHeaders(rawHeaders);

			headerValues.forEach((header, colIndex) => {
				inclusionMap[header] =
					sheet.getCell(0, colIndex).value?.toString() ?? "";
				filterableMap[header] =
					sheet.getCell(1, colIndex).value?.toString() ?? "";
			});
		}

		const includedColumns = Object.keys(inclusionMap).filter(
			(key) => inclusionMap[key]?.toLowerCase() === "true",
		);

		return {
			sheet,
			headerValues,
			inclusionMap,
			filterableMap,
			includedColumns,
		};
	},

	async syncData(
		db: DB,
		params: {
			activityId: string;
			googleSheetId: string;
			googleSheetName: string;
			handlingMode: string;
		},
	) {
		const { sheet, includedColumns, filterableMap } =
			await this.getMetadata(params);

		const sheetConfig = includedColumns.map((col, index) => ({
			columnName: col,
			isFilterable: filterableMap[col]?.toLowerCase() === "true",
			displayOrder: index,
		}));

		// Load cells to get data
		// We'll load up to the number of rows we have + some extra for potential empty styled rows
		const rowCount = Math.max(sheet.rowCount, 50);
		const colCount = sheet.columnCount;
		await sheet.loadCells({
			startRowIndex: 0,
			endRowIndex: rowCount,
			startColumnIndex: 0,
			endColumnIndex: colCount,
		});

		const dataToSave: GoogleSheetDataInsert[] = [];
		const isSimpleDisplay = params.handlingMode === "simple display";

		// For process mode, data starts from row 3 (index 2). For simple, row 1 (index 0).
		const startIdx = isSimpleDisplay ? 0 : 2;

		for (let i = startIdx; i < rowCount; i++) {
			const rowData: Record<string, string> = {};
			let hasData = false;

			includedColumns.forEach((col, colIdx) => {
				const cell = sheet.getCell(i, colIdx);
				const val = cell.value?.toString() ?? "";
				rowData[col] = val.replace(/\r\n/g, "\n").trim();
				if (val) hasData = true;
			});

			if (hasData) {
				dataToSave.push({
					activityId: params.activityId,
					data: rowData,
					rowOrder: i,
				});
			}
		}

		await db.transaction(async (tx) => {
			await tx
				.delete(googleSheetData)
				.where(eq(googleSheetData.activityId, params.activityId));

			await tx
				.update(activities)
				.set({ sheetConfig })
				.where(eq(activities.id, params.activityId));

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
		activityId: string,
		filters?: Record<string, string[]>,
		search?: string,
	): SQL | undefined {
		const filterConditions: SQL[] = [
			eq(googleSheetData.activityId, activityId),
		];

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

		const searchCondition = search
			? sql`${googleSheetData.data}::text ILIKE ${`%${search}%`}`
			: undefined;

		if (searchCondition) {
			filterConditions.push(searchCondition);
		}

		return and(...filterConditions);
	},

	/**
	 * Get unique values for a specific column to populate filters
	 */
	async getUniqueValues(
		db: DB,
		activityId: string,
		columnName: string,
	): Promise<string[]> {
		const result = await db.execute<{ value: string | null }>(
			sql`SELECT ${googleSheetData.data}->>${columnName} as value 
          FROM ${googleSheetData} 
          WHERE ${googleSheetData.activityId} = ${activityId} 
          AND ${googleSheetData.data}->>${columnName} IS NOT NULL`,
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
