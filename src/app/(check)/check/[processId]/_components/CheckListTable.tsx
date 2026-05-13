"use client";

import { Checkbox, Table } from "@heroui/react";
import { useMemo } from "react";

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

interface CheckListTableProps {
	columns: Column[];
	data: DataRow[];
	onCheckboxChange: (id: number, columnName: string, newValue: boolean) => void;
}

export function CheckListTable({
	columns,
	data,
	onCheckboxChange,
}: CheckListTableProps) {
	const sortedData = useMemo(() => {
		return [...data].sort((a, b) => a.id - b.id);
	}, [data]);

	if (columns.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<p className="font-medium">未選擇欄位</p>
				<p className="text-sm">請至少選擇一個欄位進行顯示。</p>
			</div>
		);
	}

	return (
		<Table variant="secondary">
			<Table.ScrollContainer>
				<Table.Content aria-label="報到清單數據表">
					<Table.Header>
						{columns.map((col, index) => (
							<Table.Column
								id={col.columnName}
								isRowHeader={index === 0}
								key={col.columnName}
							>
								{col.columnName}
							</Table.Column>
						))}
					</Table.Header>
					<Table.Body>
						{sortedData.map((row) => (
							<Table.Row id={row.id.toString()} key={row.id}>
								{columns.map((col) => {
									const value = (row.data as Record<string, unknown>)[
										col.columnName
									];

									return (
										<Table.Cell key={`${row.id}-${col.columnName}`}>
											{col.isCheckbox ? (
												<div className="flex justify-center">
													<Checkbox
														aria-label={`為第 ${row.id} 列核取 ${col.columnName}`}
														isSelected={!!value}
														onChange={(isSelected) => {
															onCheckboxChange(
																row.id,
																col.columnName,
																isSelected,
															);
														}}
													>
														<Checkbox.Control>
															<Checkbox.Indicator />
														</Checkbox.Control>
													</Checkbox>
												</div>
											) : (
												<span className="whitespace-pre-wrap text-sm">
													{value?.toString() ?? ""}
												</span>
											)}
										</Table.Cell>
									);
								})}
							</Table.Row>
						))}
					</Table.Body>
				</Table.Content>
			</Table.ScrollContainer>
		</Table>
	);
}
