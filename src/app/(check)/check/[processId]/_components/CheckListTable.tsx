"use client";

import { useMemo } from "react";
import { Checkbox, Table } from "@heroui/react";

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

	return (
		<Table variant="secondary">
			<Table.ScrollContainer>
				<Table.Content aria-label="Check-in list data table">
					<Table.Header>
						{columns.map((col) => (
							<Table.Column
								isRowHeader={col.displayOrder === 0}
								key={col.columnName}
							>
								{col.columnName}
							</Table.Column>
						))}
					</Table.Header>
					<Table.Body>
						{sortedData.map((row) => (
							<Table.Row key={row.id}>
								{columns.map((col) => {
									const value = (row.data as Record<string, unknown>)[
										col.columnName
									];

									return (
										<Table.Cell key={`${row.id}-${col.columnName}`}>
											{col.isCheckbox ? (
												<div className="flex justify-center">
													<Checkbox
														aria-label={`Check-in ${col.columnName} for row ${row.id}`}
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
