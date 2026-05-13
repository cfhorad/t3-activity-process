"use client";

import { Label, ListBox, Select, Table } from "@heroui/react";
import { useMemo, useState } from "react";

interface Column {
	id: number;
	columnName: string;
	isCheckbox: boolean;
	isFilterable: boolean;
	displayOrder: number;
}

interface DataRow {
	id: number;
	processId: number;
	data: unknown;
}

interface CheckboxStatsTableProps {
	columns: Column[];
	data: DataRow[];
}

interface StatRow {
	id: string;
	groupName: string;
	[key: string]: string | number;
}

export function CheckboxStatsTable({ columns, data }: CheckboxStatsTableProps) {
	// 1. Identify all checkbox columns (X-axis)
	const checkboxColumns = useMemo(
		() =>
			columns
				.filter((col) => col.isCheckbox)
				.sort((a, b) => a.displayOrder - b.displayOrder),
		[columns],
	);

	// 2. Identify eligible Y-axis columns (non-checkbox columns)
	const groupableColumns = useMemo(
		() =>
			columns
				.filter((col) => !col.isCheckbox)
				.sort((a, b) => a.displayOrder - b.displayOrder),
		[columns],
	);

	// Default to the first groupable column
	const [groupByColumn, setGroupByColumn] = useState<string>(
		groupableColumns[0]?.columnName ?? "",
	);

	// 3. Process the data
	const statsData = useMemo<StatRow[]>(() => {
		if (!groupByColumn || checkboxColumns.length === 0) return [];

		const groups: Record<string, Record<string, number>> = {};

		for (const row of data) {
			const rowData = row.data as Record<string, unknown>;
			const rawGroupValue = rowData[groupByColumn];
			const groupValue = rawGroupValue ? String(rawGroupValue) : "Unknown";

			if (!groups[groupValue]) {
				const initialCounts: Record<string, number> = {};
				// Initialize all checkbox counts to 0
				for (const col of checkboxColumns) {
					initialCounts[col.columnName] = 0;
				}
				groups[groupValue] = initialCounts;
			}

			const currentGroup = groups[groupValue];
			if (currentGroup) {
				// Add to sums
				for (const col of checkboxColumns) {
					const val = rowData[col.columnName];
					// If the value is truthy (checked)
					if (val) {
						currentGroup[col.columnName] =
							(currentGroup[col.columnName] ?? 0) + 1;
					}
				}
			}
		}

		// Convert object map to array for the table
		const rows = Object.entries(groups).map(([groupName, counts]) => ({
			id: groupName,
			groupName,
			...counts,
		}));

		// Calculate Grand Total
		const totals: Record<string, number> = {};
		for (const col of checkboxColumns) {
			totals[col.columnName] = data.reduce((sum, row) => {
				const rowData = row.data as Record<string, unknown>;
				return sum + (rowData[col.columnName] ? 1 : 0);
			}, 0);
		}

		if (rows.length > 0) {
			return [
				{
					id: "grand-total",
					groupName: "總計",
					...totals,
				},
				...rows,
			];
		}

		return rows;
	}, [data, groupByColumn, checkboxColumns]);

	if (columns.length === 0) {
		return null;
	}

	if (checkboxColumns.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<p className="font-medium">No Checkbox Columns Found</p>
				<p className="text-sm">
					Statistics require at least one checkbox column in your Google Sheet.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex w-full max-w-xs flex-col gap-2">
				<Select
					onChange={(val) => {
						if (val) setGroupByColumn(String(val));
					}}
					value={groupByColumn || null}
					variant="primary"
				>
					<Label>Group By (Y-Axis)</Label>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							{groupableColumns.map((col) => (
								<ListBox.Item
									id={col.columnName}
									key={col.columnName}
									textValue={col.columnName}
								>
									{col.columnName}
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
			</div>

			<Table aria-label="Checkbox Statistics Table" variant="secondary">
				<Table.ScrollContainer>
					<Table.Content>
						<Table.Header>
							<Table.Column id="group-column" isRowHeader>
								{groupByColumn || "Group"}
							</Table.Column>
							{checkboxColumns.map((col) => (
								<Table.Column id={col.columnName} key={col.columnName}>
									{col.columnName}
								</Table.Column>
							))}
						</Table.Header>
						<Table.Body>
							{statsData.length === 0 ? (
								<Table.Row id="no-data">
									<Table.Cell>No data available for statistics.</Table.Cell>
									{checkboxColumns.map((col) => (
										<Table.Cell key={col.columnName}>-</Table.Cell>
									))}
								</Table.Row>
							) : (
								statsData.map((row) => {
									const isTotal = row.id === "grand-total";
									return (
										<Table.Row id={row.id} key={row.id}>
											<Table.Cell
												className={
													isTotal ? "font-bold text-danger" : "font-medium"
												}
											>
												{row.groupName}
											</Table.Cell>
											{checkboxColumns.map((col) => (
												<Table.Cell
													className={isTotal ? "font-bold text-danger" : ""}
													key={col.columnName}
												>
													{row[col.columnName] as number}
												</Table.Cell>
											))}
										</Table.Row>
									);
								})
							)}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>
		</div>
	);
}
