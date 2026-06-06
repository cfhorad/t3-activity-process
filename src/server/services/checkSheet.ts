import { and, eq, or, type SQL, sql } from "drizzle-orm";
import type { db as database } from "~/server/db";
import { googleSheetConfig, googleSheetData } from "~/server/db/schema";
import { parseCSV } from "~/utils/csv";

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
		_spreadsheetId: string, // Kept to avoid changing router calling signatures
		sheetName: string, // This parameter now receives the CSV URL
	) {
		const response = await fetch(sheetName, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
		});
		if (!response.ok) {
			if (response.status === 401) {
				throw new Error(
					"無法取得 CSV 檔案 (401 Unauthorized)。請確認您的 Google 試算表已「發布到網路」（檔案 -> 分享 -> 發布到網路），且沒有受限於您的組織網域限制（例如企業 G Suite 限制外部存取）。",
				);
			}
			if (response.status === 403) {
				throw new Error(
					"無法取得 CSV 檔案 (403 Forbidden)。該試算表可能限制了存取權限，請確認試算表已設定為「發布到網路」且所有人皆可讀取。",
				);
			}
			throw new Error(
				`無法取得 CSV 檔案：${response.statusText} (${response.status})`,
			);
		}
		const csvText = await response.text();
		const rows = parseCSV(csvText);

		if (rows.length < 3) {
			throw new Error(
				"CSV 檔案格式錯誤，必須至少包含 3 列（第 1 列：核取方塊、第 2 列：篩選條件、第 3 列：表頭）。",
			);
		}

		const checkboxRow = rows[0] ?? [];
		const filterableRow = rows[1] ?? [];
		const headerRow = rows[2] ?? [];

		const headers: string[] = [];
		const checkboxFlags: boolean[] = [];
		const filterableFlags: boolean[] = [];

		for (let i = 0; i < headerRow.length; i++) {
			const headerValue = headerRow[i]?.trim() ?? "";
			if (headerValue !== "") {
				headers.push(headerValue);
				checkboxFlags.push(checkboxRow[i]?.trim().toLowerCase() === "true");
				filterableFlags.push(filterableRow[i]?.trim().toLowerCase() === "true");
			} else {
				// Stop at the first empty header
				break;
			}
		}

		if (headers.length === 0) {
			throw new Error(
				"表頭列（第 3 列）沒有任何欄位名稱。請確認第 3 列包含欄位標題。",
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

		const dataToSave: {
			processId: number;
			data: Record<string, string | boolean>;
		}[] = [];

		// Iterate through rows starting from index 3 (Row 4)
		for (let r = 3; r < rows.length; r++) {
			const row = rows[r] ?? [];
			const filteredObj: Record<string, string | boolean> = {};
			let hasValue = false;

			headers.forEach((col, cIndex) => {
				const isCheckbox = checkboxFlags[cIndex];
				const val = row[cIndex] ?? "";

				if (val !== "") hasValue = true;

				if (isCheckbox) {
					const stringVal = val.toLowerCase().trim();
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
		// Handle both postgres-js (array) and neon-http ({ rows: [] })
		const rows = Array.isArray(result)
			? (result as unknown as { value: string | boolean | null }[])
			: (result as unknown as { rows: { value: string | boolean | null }[] }).rows;
		for (const row of rows) {
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
