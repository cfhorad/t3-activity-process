"use client";

import {
	Button,
	Checkbox,
	Chip,
	cn,
	Label,
	ListBox,
	Modal,
	Select,
	Table,
	Tooltip,
	toast,
	useOverlayState,
} from "@heroui/react";
import { Download, Phone, Save, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "~/app/_hooks/useAuth";
import { api } from "~/trpc/react";

// ─── TYPES ───────────────────────────────────────────────────

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
	processId: number;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Column Selection Dropdown Component
 */
interface ColumnSelectProps {
	columns: Column[];
	visibleColumnNames: string[];
	onSelectionChange: (keys: string[]) => void;
}

function ColumnSelect({
	columns,
	visibleColumnNames,
	onSelectionChange,
}: ColumnSelectProps) {
	if (!columns || columns.length === 0) return null;

	return (
		<Select
			aria-label="選擇可見欄位"
			className="w-full sm:max-w-[240px]"
			onChange={(val) => {
				if (Array.isArray(val)) {
					onSelectionChange(val.map((v) => String(v)));
				}
			}}
			placeholder="顯示/隱藏欄位"
			selectionMode="multiple"
			value={visibleColumnNames}
			variant="primary"
		>
			<Label className="flex items-center gap-2">
				<Settings2 className="size-4" />
				可見欄位
			</Label>
			<Select.Trigger>
				<Select.Value>
					{({ isPlaceholder, state }) => {
						if (isPlaceholder || state.selectedItems.length === 0) {
							return "顯示/隱藏欄位";
						}

						return (
							<div className="flex flex-wrap gap-1">
								{state.selectedItems.length === columns.length ? (
									<Chip className="font-medium" size="sm" variant="soft">
										全部欄位
									</Chip>
								) : (
									<Chip className="font-medium" size="sm" variant="soft">
										{state.selectedItems.length} 個欄位
									</Chip>
								)}
							</div>
						);
					}}
				</Select.Value>
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox selectionMode="multiple">
					{columns.map((col) => (
						<ListBox.Item
							id={col.columnName}
							key={col.columnName}
							textValue={col.columnName}
						>
							<div className="whitespace-pre-wrap">{col.columnName}</div>
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}

/**
 * 2. Detailed Data Row Info Modal Component
 */
interface RowInfoModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	row: DataRow | null;
	allColumns: Column[];
}

function RowInfoModal({
	isOpen,
	onOpenChange,
	row,
	allColumns,
}: RowInfoModalProps) {
	if (!row) return null;
	const rowData = row.data as Record<string, unknown>;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>詳細數據資訊</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 pb-6">
						<div className="grid grid-cols-1 gap-3 rounded-xl bg-surface-secondary p-4 text-sm sm:grid-cols-2">
							{allColumns.map((col) => {
								const val = rowData[col.columnName];
								return (
									<div
										className="flex flex-col gap-1 border-separator border-b pb-2 last:border-0 last:pb-0"
										key={col.columnName}
									>
										<p className="font-semibold text-muted text-xs">
											{col.columnName}
										</p>
										<p className="font-medium">
											{col.isCheckbox ? (
												<span className={val ? "text-success" : "text-danger"}>
													{val ? "✅ 已核取" : "❌ 未核取"}
												</span>
											) : (
												val?.toString() || "—"
											)}
										</p>
									</div>
								);
							})}
						</div>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function CheckListTable({
	allColumns,
	visibleColumns,
	visibleColumnNames,
	onVisibleColumnsChange,
	data,
	onCheckboxChange,
	onSaveVisibleColumns,
	isSavingVisibleColumns,
	processId,
}: CheckListTableProps) {
	const { data: process } = api.process.getById.useQuery(
		{ id: processId },
		{
			staleTime: 1000 * 60 * 5, // Cache process metadata for 5 minutes
		},
	);
	const infoState = useOverlayState();
	const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const utils = api.useUtils();

	const { isViewer, isProcessChecker, isManagerOrAdmin } = useAuth();

	const isEditable = isProcessChecker(
		processId,
		process?.activityId,
		process?.activity?.createdById,
		process?.activity?.areaId,
	);

	const filteredAllColumns = isViewer
		? allColumns.filter(
				(col) => col.columnName !== "電話" && col.columnName !== "手機",
			)
		: allColumns;

	const filteredVisibleColumns = isViewer
		? visibleColumns.filter(
				(col) => col.columnName !== "電話" && col.columnName !== "手機",
			)
		: visibleColumns;

	const dummyScrollRef = useRef<HTMLDivElement>(null);
	const tableScrollRef = useRef<HTMLDivElement>(null);
	const [tableScrollWidth, setTableScrollWidth] = useState(0);
	const [hasOverflow, setHasOverflow] = useState(false);

	useEffect(() => {
		const tableScroll = tableScrollRef.current;
		if (!tableScroll) return;

		const updateWidth = () => {
			setTableScrollWidth(tableScroll.scrollWidth);
			setHasOverflow(tableScroll.scrollWidth > tableScroll.clientWidth);
		};

		updateWidth();

		const observer = new ResizeObserver(updateWidth);
		observer.observe(tableScroll);

		return () => observer.disconnect();
	}, []);

	const handleDummyScroll = () => {
		const dummy = dummyScrollRef.current;
		const table = tableScrollRef.current;
		if (!dummy || !table) return;
		if (table.scrollLeft !== dummy.scrollLeft) {
			table.scrollLeft = dummy.scrollLeft;
		}
	};

	const handleTableScroll = () => {
		const dummy = dummyScrollRef.current;
		const table = tableScrollRef.current;
		if (!dummy || !table) return;
		if (dummy.scrollLeft !== table.scrollLeft) {
			dummy.scrollLeft = table.scrollLeft;
		}
	};

	const handleRowPress = (row: DataRow) => {
		setSelectedRow(row);
		infoState.open();
	};

	/**
	 * Imperatively fetches all unfiltered, unsorted checklist rows for this process
	 * and outputs them to a CSV download locally.
	 */
	const downloadUnfilteredCSV = async () => {
		try {
			setIsDownloading(true);

			// 1. Fetch complete database checklist rows without applying current UI filters/searches
			const allData = await utils.checkSheet.getAll.fetch({
				processId,
				search: "",
				filters: {},
			});

			if (!allData || allData.length === 0) {
				toast.danger("沒有資料可供下載");
				return;
			}

			// 2. Select headers matching all allowed columns (hiding phone/mobile fields if user is a Viewer)
			const headers = filteredAllColumns.map((col) => col.columnName);

			// 3. Transform database rows to CSV fields
			const csvRows = allData.map((row) => {
				const rowData = row.data as Record<string, unknown>;
				const csvRow = filteredAllColumns.map((col) => {
					const val = rowData[col.columnName];
					if (col.isCheckbox) {
						return val ? "已核取" : "未核取";
					}
					return val !== undefined && val !== null ? String(val) : "";
				});

				// Escape fields for safety
				return csvRow
					.map((field) => {
						const escaped = field.replace(/"/g, '""');
						return `"${escaped}"`;
					})
					.join(",");
			});

			// 4. Join all lines
			const csvContent = [
				headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
				...csvRows,
			].join("\n");

			// 5. Append UTF-8 Byte Order Mark (BOM) to prevent Excel garbling Chinese letters
			const blob = new Blob([`\uFEFF${csvContent}`], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.setAttribute("href", url);

			// Filename pattern: checklist-[process-name]-[date].csv
			const processName = process?.name || "checklist";
			const timestamp = new Date().toISOString().slice(0, 10);
			const fileName = `${processName}-${timestamp}.csv`;
			link.setAttribute("download", fileName);

			// 6. Append to document, trigger, and discard
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success("CSV 檔案下載成功");
		} catch (error) {
			console.error("Failed to download CSV:", error);
			toast.danger("下載 CSV 失敗，請重試");
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex w-full flex-row flex-nowrap items-end justify-between gap-4">
				<ColumnSelect
					columns={filteredAllColumns}
					onSelectionChange={onVisibleColumnsChange}
					visibleColumnNames={visibleColumnNames}
				/>
				{isManagerOrAdmin && (
					<div className="flex shrink-0 items-center gap-3 sm:gap-6">
						<Tooltip closeDelay={0} delay={0}>
							<Tooltip.Trigger>
								<Button
									aria-label="匯出完整 CSV"
									className="text-success"
									isIconOnly
									isPending={isDownloading}
									onPress={downloadUnfilteredCSV}
									size="sm"
									variant="tertiary"
								>
									<Download className="size-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content placement="top">
								下載完整報到清單數據
							</Tooltip.Content>
						</Tooltip>

						<Tooltip closeDelay={0} delay={0}>
							<Tooltip.Trigger>
								<Button
									aria-label="儲存欄位設定"
									className="text-accent"
									isIconOnly
									isPending={isSavingVisibleColumns}
									onPress={onSaveVisibleColumns}
									size="sm"
									variant="tertiary"
								>
									<Save className="size-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content placement="top">
								儲存目前的顯示欄位設定，下次進入此頁面時將維持同樣的配置。
							</Tooltip.Content>
						</Tooltip>
					</div>
				)}
			</div>

			{hasOverflow && (
				<div
					className="w-full select-none overflow-x-auto overflow-y-hidden"
					onScroll={handleDummyScroll}
					ref={dummyScrollRef}
				>
					<div style={{ width: `${tableScrollWidth}px`, height: "1px" }} />
				</div>
			)}

			<Table variant="secondary">
				<Table.ScrollContainer
					onScroll={handleTableScroll}
					ref={tableScrollRef}
				>
					<Table.Content aria-label="報到清單數據表">
						<Table.Header>
							{filteredVisibleColumns.length === 0 ? (
								<Table.Column id="placeholder" isRowHeader>
									未選擇欄位
								</Table.Column>
							) : (
								filteredVisibleColumns.map((col, index) => (
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
							{filteredVisibleColumns.length === 0 ? (
								<Table.Row id="no-columns">
									<Table.Cell>
										<div className="flex flex-col items-center justify-center py-20 text-muted">
											<p className="font-medium">未選擇欄位</p>
											<p className="text-sm">請至少選擇一個欄位進行顯示。</p>
										</div>
									</Table.Cell>
								</Table.Row>
							) : (
								data.map((row) => (
									<Table.Row
										className={cn(
											"transition-colors",
											!isViewer &&
												"cursor-pointer hover:bg-surface-secondary/50",
										)}
										id={row.id.toString()}
										key={row.id}
										onAction={!isViewer ? () => handleRowPress(row) : undefined}
									>
										{filteredVisibleColumns.map((col) => {
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
																isDisabled={!isEditable}
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
				allColumns={filteredAllColumns}
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
				row={selectedRow}
			/>
		</div>
	);
}
