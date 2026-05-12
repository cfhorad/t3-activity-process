"use client";

import { Chip, Label, ListBox, Select } from "@heroui/react";
import { Settings2 } from "lucide-react";

interface ColumnSelectProps {
	columns: { id: number; columnName: string }[];
	visibleColumnNames: string[];
	onSelectionChange: (keys: string[]) => void;
}

export function ColumnSelect({
	columns,
	visibleColumnNames,
	onSelectionChange,
}: ColumnSelectProps) {
	if (!columns || columns.length === 0) return null;

	return (
		<Select
			aria-label="Select visible columns"
			className="w-full sm:max-w-[240px]"
			onChange={(val) => {
				if (Array.isArray(val)) {
					onSelectionChange(val.map((v) => String(v)));
				}
			}}
			placeholder="Show/Hide Columns"
			selectionMode="multiple"
			value={visibleColumnNames}
			variant="primary"
		>
			<Label className="flex items-center gap-2">
				<Settings2 className="size-4" />
				Visible Columns
			</Label>
			<Select.Trigger>
				<Select.Value>
					{({ isPlaceholder, state }) => {
						if (isPlaceholder || state.selectedItems.length === 0) {
							return "Show/Hide Columns";
						}

						return (
							<div className="flex flex-wrap gap-1">
								{state.selectedItems.length === columns.length ? (
									<Chip className="font-medium" size="sm" variant="soft">
										All Columns
									</Chip>
								) : (
									<Chip className="font-medium" size="sm" variant="soft">
										{state.selectedItems.length} Columns
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
