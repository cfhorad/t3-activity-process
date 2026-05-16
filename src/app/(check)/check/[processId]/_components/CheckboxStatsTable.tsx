"use client";

import {
	Button,
	Checkbox,
	Label,
	ListBox,
	Select,
	Table,
	Tooltip,
} from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import { useCheckboxStats } from "../_hooks/useCheckboxStats";

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
	onRefetch?: () => void;
	isRefetching?: boolean;
}

export function CheckboxStatsTable({
	columns,
	data,
	onRefetch,
	isRefetching,
}: CheckboxStatsTableProps) {
	const {
		checkboxColumns,
		groupableColumns,
		groupByColumn,
		setGroupByColumn,
		showRowRatio,
		setShowRowRatio,
		statsData,
	} = useCheckboxStats(columns, data);

	if (columns.length === 0) {
		return null;
	}

	if (checkboxColumns.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<p className="font-medium">未找到核取方塊欄位</p>
				<p className="text-sm">
					統計需要您的 Google 試算表中至少有一個核取方塊欄位。
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex w-full flex-wrap items-end justify-between gap-4">
				<div className="flex max-w-xs flex-col gap-2">
					<Select
						onChange={(val) => {
							if (val) setGroupByColumn(String(val));
						}}
						value={groupByColumn || null}
						variant="primary"
					>
						<Label>分組依據 (Y 軸)</Label>
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

				<div className="flex items-center gap-6">
					<Tooltip closeDelay={0} delay={0}>
						<Tooltip.Trigger>
							<Checkbox isSelected={showRowRatio} onChange={setShowRowRatio}>
								<Checkbox.Control className="size-5 rounded-full border border-default-400">
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Label className="cursor-pointer font-medium text-sm">
									顯示比率欄位
								</Label>
							</Checkbox>
						</Tooltip.Trigger>
						<Tooltip.Content placement="top">
							在統計表中顯示各分組的核取百分比與詳細比例。
						</Tooltip.Content>
					</Tooltip>

					{onRefetch && (
						<Tooltip closeDelay={0} delay={0}>
							<Tooltip.Trigger>
								<Button
									className="text-muted-foreground"
									isIconOnly
									isPending={isRefetching}
									onPress={onRefetch}
									size="sm"
									variant="tertiary"
								>
									{!isRefetching && <RefreshCcw className="size-4" />}
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content placement="top">
								手動重新獲取最新統計資料
							</Tooltip.Content>
						</Tooltip>
					)}
				</div>
			</div>

			<Table aria-label="核取方塊統計表" variant="secondary">
				<Table.ScrollContainer>
					<Table.Content>
						<Table.Header>
							<Table.Column
								className="whitespace-nowrap"
								id="group-column"
								isRowHeader
							>
								{groupByColumn || "分組"}
							</Table.Column>
							{showRowRatio && (
								<Table.Column className="whitespace-nowrap" id="row-ratio">
									比率
								</Table.Column>
							)}
							{checkboxColumns.map((col) => (
								<Table.Column
									className="whitespace-nowrap text-center"
									id={col.columnName}
									key={col.columnName}
								>
									{col.columnName}
								</Table.Column>
							))}
						</Table.Header>
						<Table.Body>
							{statsData.length === 0 ? (
								<Table.Row id="no-data">
									<Table.Cell className="whitespace-nowrap">
										無可用統計數據。
									</Table.Cell>
									{showRowRatio && (
										<Table.Cell className="whitespace-nowrap">-</Table.Cell>
									)}
									{checkboxColumns.map((col) => (
										<Table.Cell
											className="whitespace-nowrap"
											key={col.columnName}
										>
											-
										</Table.Cell>
									))}
								</Table.Row>
							) : (
								statsData.map((row) => {
									const isTotal = row.id === "grand-total";
									const isRatio = row.id === "grand-ratio";
									const isSpecialRow = isTotal || isRatio;

									return (
										<Table.Row id={row.id} key={row.id}>
											<Table.Cell
												className={`${
													isSpecialRow ? "font-bold" : "font-medium"
												} ${isTotal ? "text-danger" : ""} ${
													isRatio ? "text-accent" : ""
												} whitespace-nowrap`}
											>
												{row.groupName}
											</Table.Cell>
											{showRowRatio && (
												<Table.Cell className="whitespace-nowrap font-bold text-accent">
													{row.rowRatio}
												</Table.Cell>
											)}
											{checkboxColumns.map((col) => (
												<Table.Cell
													className={`${isSpecialRow ? "font-bold" : ""} ${
														isTotal ? "text-danger" : ""
													} ${isRatio ? "text-accent" : ""} whitespace-nowrap text-center`}
													key={col.columnName}
												>
													{row[col.columnName]}
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
