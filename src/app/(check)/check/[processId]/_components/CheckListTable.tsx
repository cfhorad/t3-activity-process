"use client";

import {
	Button,
	Checkbox,
	Table,
	Tooltip,
	useOverlayState,
} from "@heroui/react";
import { Phone, Save } from "lucide-react";
import { useState } from "react";
import { ColumnSelect } from "./ColumnSelect";
import { RowInfoModal } from "./RowInfoModal";

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

interface CheckListTableProps {
	allColumns: Column[];
	visibleColumns: Column[];
	visibleColumnNames: string[];
	onVisibleColumnsChange: (keys: string[]) => void;
	data: DataRow[];
	onCheckboxChange: (id: number, columnName: string, newValue: boolean) => void;
	onSaveVisibleColumns: () => void;
	isSavingVisibleColumns: boolean;
}

export function CheckListTable({
	allColumns,
	visibleColumns,
	visibleColumnNames,
	onVisibleColumnsChange,
	data,
	onCheckboxChange,
	onSaveVisibleColumns,
	isSavingVisibleColumns,
}: CheckListTableProps) {
	const infoState = useOverlayState();
	const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);

	const handleRowPress = (row: DataRow) => {
		setSelectedRow(row);
		infoState.open();
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex w-full items-center justify-between gap-4">
				<ColumnSelect
					columns={allColumns}
					onSelectionChange={onVisibleColumnsChange}
					visibleColumnNames={visibleColumnNames}
				/>
				<Tooltip closeDelay={0} delay={0}>
					<Tooltip.Trigger>
						<Button
							isPending={isSavingVisibleColumns}
							onPress={onSaveVisibleColumns}
							size="sm"
							variant="secondary"
						>
							<Save className="size-4 sm:mr-2" />
							<span className="hidden sm:inline">儲存欄位設定</span>
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content placement="top">
						儲存目前的顯示欄位設定，下次進入此頁面時將維持同樣的配置。
					</Tooltip.Content>
				</Tooltip>
			</div>

			<Table variant="secondary">
				<Table.ScrollContainer>
					<Table.Content aria-label="報到清單數據表">
						<Table.Header>
							{visibleColumns.length === 0 ? (
								<Table.Column id="placeholder" isRowHeader>
									未選擇欄位
								</Table.Column>
							) : (
								visibleColumns.map((col, index) => (
									<Table.Column
										className={`whitespace-nowrap ${col.isCheckbox ? "text-center" : ""}`}
										id={col.columnName}
										isRowHeader={index === 0}
										key={col.columnName}
									>
										{col.columnName}
									</Table.Column>
								))
							)}
						</Table.Header>
						<Table.Body>
							{visibleColumns.length === 0 ? (
								<Table.Row id="no-columns">
									<Table.Cell>
										<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
											<p className="font-medium">未選擇欄位</p>
											<p className="text-sm">請至少選擇一個欄位進行顯示。</p>
										</div>
									</Table.Cell>
								</Table.Row>
							) : (
								data.map((row) => (
									<Table.Row
										className="cursor-pointer transition-colors hover:bg-content2/50"
										id={row.id.toString()}
										key={row.id}
										onAction={() => handleRowPress(row)}
									>
										{visibleColumns.map((col) => {
											const value = (row.data as Record<string, unknown>)[
												col.columnName
											];
											return (
												<Table.Cell
													className="whitespace-nowrap"
													key={`${row.id}-${col.columnName}`}
												>
													{col.isCheckbox ? (
														<div className="flex justify-center">
															<Checkbox
																aria-label={`為第 ${row.id} 列核取 ${col.columnName}`}
																className="**:data-[slot='checkbox-default-indicator--checkmark']:size-4"
																isSelected={!!value}
																onChange={(isSelected) => {
																	onCheckboxChange(
																		row.id,
																		col.columnName,
																		isSelected,
																	);
																}}
																onClick={(e) => e.stopPropagation()}
															>
																<Checkbox.Control className="size-6 rounded-full before:rounded-full">
																	<Checkbox.Indicator />
																</Checkbox.Control>
															</Checkbox>
														</div>
													) : (
														<div className="flex items-center text-sm">
															{(col.columnName === "電話" ||
																col.columnName === "手機") &&
															value ? (
																<Tooltip closeDelay={0} delay={0}>
																	<Tooltip.Trigger>
																		<a
																			className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success transition-colors hover:bg-success-soft-hover"
																			href={`tel:${value.toString().replace(/\s/g, "")}`}
																			onClick={(e) => e.stopPropagation()}
																		>
																			<Phone className="size-4" />
																		</a>
																	</Tooltip.Trigger>
																	<Tooltip.Content placement="top">
																		撥打 {value.toString()}
																	</Tooltip.Content>
																</Tooltip>
															) : (
																<span className="whitespace-nowrap">
																	{value?.toString() ?? ""}
																</span>
															)}
														</div>
													)}
												</Table.Cell>
											);
										})}
									</Table.Row>
								))
							)}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>

			<RowInfoModal
				allColumns={allColumns}
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
				row={selectedRow}
			/>
		</div>
	);
}
