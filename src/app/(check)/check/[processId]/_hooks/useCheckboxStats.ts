"use client";

import { toast } from "@heroui/react";
import { useState } from "react";

export interface Column {
	id: number;
	columnName: string;
	isCheckbox: boolean;
	isFilterable: boolean;
	displayOrder: number;
}

export interface DataRow {
	id: number;
	processId: number;
	data: unknown;
}

export interface StatRow {
	id: string;
	groupName: string;
	rowRatio: string;
	[key: string]: string | number;
}

export function useCheckboxStats(
	columns: Column[],
	data: DataRow[],
	options?: {
		groupByColumn?: string;
		setGroupByColumn?: (val: string) => void;
		showRowRatio?: boolean;
		setShowRowRatio?: (val: boolean) => void;
	},
) {
	// 1. Identify all checkbox columns (X-axis)
	const checkboxColumns = columns
		.filter((col) => col.isCheckbox)
		.sort((a, b) => a.displayOrder - b.displayOrder);

	// 2. Identify eligible Y-axis columns (non-checkbox columns)
	const groupableColumns = columns
		.filter((col) => !col.isCheckbox)
		.sort((a, b) => a.displayOrder - b.displayOrder);

	// Default state if not provided externally (liftoff support)
	const [localGroupByColumn, setLocalGroupByColumn] = useState<string>("");
	const [localShowRowRatio, setLocalShowRowRatio] = useState(false);

	const rawGroupByColumn =
		options?.groupByColumn !== undefined
			? options.groupByColumn
			: localGroupByColumn;
	const setGroupByColumn = options?.setGroupByColumn || setLocalGroupByColumn;
	const showRowRatio =
		options?.showRowRatio !== undefined
			? options.showRowRatio
			: localShowRowRatio;
	const setShowRowRatio = options?.setShowRowRatio || setLocalShowRowRatio;

	const groupByColumn =
		rawGroupByColumn || (groupableColumns[0]?.columnName ?? "");

	// 3. Process the data
	const statsData: StatRow[] = (() => {
		if (!groupByColumn || checkboxColumns.length === 0) return [];

		const groups: Record<
			string,
			{ counts: Record<string, number>; total: number }
		> = {};

		for (const row of data) {
			const rowData = row.data as Record<string, unknown>;
			const rawGroupValue = rowData[groupByColumn];
			const groupValue = rawGroupValue ? String(rawGroupValue) : "未知";

			if (!groups[groupValue]) {
				const initialCounts: Record<string, number> = {};
				for (const col of checkboxColumns) {
					initialCounts[col.columnName] = 0;
				}
				groups[groupValue] = { counts: initialCounts, total: 0 };
			}

			const groupInfo = groups[groupValue];
			if (groupInfo) {
				groupInfo.total += 1;

				for (const col of checkboxColumns) {
					if (rowData[col.columnName]) {
						groupInfo.counts[col.columnName] =
							(groupInfo.counts[col.columnName] ?? 0) + 1;
					}
				}
			}
		}

		// Convert object map to array for the table
		const rows = Object.entries(groups)
			.map(([groupName, info]) => {
				const rowTotalChecked = Object.values(info.counts).reduce(
					(a, b) => a + b,
					0,
				);
				const possibleChecked = info.total * checkboxColumns.length;
				const rowRatio =
					possibleChecked > 0
						? `${((rowTotalChecked / possibleChecked) * 100).toFixed(0)}%`
						: "0%";

				return {
					id: groupName,
					groupName,
					rowRatio,
					...info.counts,
				};
			})
			.sort((a, b) => a.groupName.localeCompare(b.groupName, "zh-Hant"));

		// Calculate Grand Totals
		const totals: Record<string, number> = {};
		for (const col of checkboxColumns) {
			totals[col.columnName] = data.reduce((sum, row) => {
				const rowData = row.data as Record<string, unknown>;
				return sum + (rowData[col.columnName] ? 1 : 0);
			}, 0);
		}

		// Calculate Grand Ratios (for the Ratio row)
		const columnRatios: Record<string, string> = {};
		for (const col of checkboxColumns) {
			const totalCount = totals[col.columnName] ?? 0;
			const percentage = data.length > 0 ? (totalCount / data.length) * 100 : 0;
			columnRatios[col.columnName] = `${percentage.toFixed(0)}%`;
		}

		// Calculate Grand Row Ratio (Overall average)
		const grandTotalChecked = Object.values(totals).reduce((a, b) => a + b, 0);
		const grandPossibleChecked = data.length * checkboxColumns.length;
		const grandRowRatio =
			grandPossibleChecked > 0
				? `${((grandTotalChecked / grandPossibleChecked) * 100).toFixed(0)}%`
				: "0%";

		if (rows.length > 0) {
			return [
				{
					id: "grand-total",
					groupName: "總計",
					rowRatio: grandRowRatio,
					...totals,
				},
				{
					id: "grand-ratio",
					groupName: "比率",
					rowRatio: "",
					...columnRatios,
				},
				...rows,
			];
		}

		return rows;
	})();

	/**
	 * Generates a CSV file from the computed statsData and triggers a browser download.
	 * Includes a UTF-8 Byte Order Mark (BOM) to ensure correct encoding/Chinese display in Excel.
	 */
	const downloadCSV = () => {
		if (statsData.length === 0) return;

		// 1. Build CSV headers matching the table layout
		const headers = [groupByColumn || "分組"];
		if (showRowRatio) {
			headers.push("比率");
		}
		for (const col of checkboxColumns) {
			headers.push(col.columnName);
		}

		// 2. Format row values and map to CSV fields
		const csvRows = statsData.map((row) => {
			const csvRow = [row.groupName];
			if (showRowRatio) {
				csvRow.push(row.rowRatio || "");
			}
			for (const col of checkboxColumns) {
				const val = row[col.columnName];
				csvRow.push(val !== undefined ? String(val) : "");
			}
			// Escape field values to safely handle commas, quotes, and newlines
			return csvRow
				.map((field) => {
					const escaped = field.replace(/"/g, '""');
					return `"${escaped}"`;
				})
				.join(",");
		});

		// 3. Assemble CSV string
		const csvContent = [
			headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
			...csvRows,
		].join("\n");

		// 4. Create a download link with UTF-8 BOM to prevent Excel display corruption on Chinese characters
		const blob = new Blob([`\uFEFF${csvContent}`], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);

		// Format file name using group column and current ISO date (YYYY-MM-DD)
		const timestamp = new Date().toISOString().slice(0, 10);
		const fileName = `check-stats-${groupByColumn || "group"}-${timestamp}.csv`;
		link.setAttribute("download", fileName);

		// 5. Append, click, and clean up the temporary anchor element
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast.success("CSV 檔案下載成功");
	};

	return {
		checkboxColumns,
		groupableColumns,
		groupByColumn,
		setGroupByColumn,
		showRowRatio,
		setShowRowRatio,
		statsData,
		downloadCSV,
	};
}
