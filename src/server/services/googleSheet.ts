import { and, eq, or, type SQL, sql } from "drizzle-orm";
import type { db as database } from "~/server/db";
import { googleSheetConfig, googleSheetData } from "~/server/db/schema";
import { parseCSV } from "~/utils/csv";

export type DB = typeof database;

export const googleSheetService = {
	/**
	 * Synchronize database with Google Sheets data
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
				"CSV 檔案格式錯誤，必須至少包含 3 列（第 1 列：選用欄位、第 2 列：篩選條件、第 3 列：表頭）。",
			);
		}

		const inclusionRow = rows[0] ?? [];
		const filterableRow = rows[1] ?? [];
		const headers = rows[2] ?? [];

		// Filter out empty headers
		const headerValues: string[] = [];
		const colIndices: number[] = [];

		headers.forEach((header, colIndex) => {
			const trimmedHeader = header.trim();
			if (trimmedHeader !== "") {
				headerValues.push(trimmedHeader);
				colIndices.push(colIndex);
			}
		});

		if (headerValues.length === 0) {
			throw new Error("表頭列（第 3 列）沒有任何欄位名稱。");
		}

		const inclusionMap: Record<string, string> = {};
		const filterableMap: Record<string, string> = {};
		const colIndexMap: Record<string, number> = {};

		headerValues.forEach((header, index) => {
			const origColIndex = colIndices[index] ?? 0;
			inclusionMap[header] = inclusionRow[origColIndex]?.trim() ?? "";
			filterableMap[header] = filterableRow[origColIndex]?.trim() ?? "";
			colIndexMap[header] = origColIndex;
		});

		const includedColumns = headerValues.filter(
			(key) => inclusionMap[key]?.toLowerCase() === "true",
		);

		const configToSave = includedColumns.map((col, index) => ({
			processId,
			columnName: col,
			isFilterable: filterableMap[col]?.toLowerCase() === "true",
			displayOrder: index,
		}));

		const dataToSave = rows.slice(3).map((row) => {
			const filteredObj: Record<string, string> = {};

			for (const col of includedColumns) {
				const colIndex = colIndexMap[col] ?? 0;
				let val = row[colIndex] ?? "";
				val = val.replace(/\r\n/g, "\n").trim();
				filteredObj[col] = val;
			}

			return {
				processId,
				data: filteredObj,
			};
		});

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
			colCount: includedColumns.length,
		};
	},

	/**
	 * Build filter conditions for Drizzle SQL
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
	async getUniqueValues(
		db: DB,
		columnName: string,
		processId: number,
	): Promise<string[]> {
		const result = await db.execute<{ value: string | null }>(
			sql`SELECT ${googleSheetData.data}->>${columnName} as value 
          FROM ${googleSheetData} 
          WHERE ${googleSheetData.processId} = ${processId} AND ${googleSheetData.data}->>${columnName} IS NOT NULL`,
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
