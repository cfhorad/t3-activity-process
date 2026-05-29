"use client";

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

export function useCheckboxStats(columns: Column[], data: DataRow[]) {
	// 1. Identify all checkbox columns (X-axis)
	const checkboxColumns = columns
		.filter((col) => col.isCheckbox)
		.sort((a, b) => a.displayOrder - b.displayOrder);

	// 2. Identify eligible Y-axis columns (non-checkbox columns)
	const groupableColumns = columns
		.filter((col) => !col.isCheckbox)
		.sort((a, b) => a.displayOrder - b.displayOrder);

	// Default to the first groupable column
	const [groupByColumn, setGroupByColumn] = useState<string>(
		groupableColumns[0]?.columnName ?? "",
	);
	const [showRowRatio, setShowRowRatio] = useState(false);

	// 3. Process the data
	const statsData = (() => {
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

	return {
		checkboxColumns,
		groupableColumns,
		groupByColumn,
		setGroupByColumn,
		showRowRatio,
		setShowRowRatio,
		statsData,
	};
}
