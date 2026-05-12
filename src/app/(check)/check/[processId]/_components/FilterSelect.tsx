"use client";

import { Chip, Label, ListBox, Select } from "@heroui/react";
import { api } from "~/trpc/react";

interface FilterSelectProps {
	processId: number;
	columnName: string;
	selectedKeys: string[];
	onSelectionChange: (keys: string[]) => void;
}

export function FilterSelect({
	processId,
	columnName,
	selectedKeys,
	onSelectionChange,
}: FilterSelectProps) {
	const { data: values } = api.checkSheet.getUniqueValues.useQuery({
		processId,
		columnName,
	});

	if (!values || values.length === 0) return null;

	return (
		<Select
			className="w-full sm:max-w-[200px]"
			onChange={(val) => {
				if (Array.isArray(val)) {
					onSelectionChange(val.map((v) => String(v)));
				}
			}}
			placeholder={`Filter by ${columnName}`}
			selectionMode="multiple"
			value={selectedKeys}
			variant="primary"
		>
			<Label>{columnName}</Label>
			<Select.Trigger>
				<Select.Value>
					{({ isPlaceholder, state }) => {
						if (isPlaceholder || state.selectedItems.length === 0) {
							return `Filter by ${columnName}`;
						}

						return (
							<div className="flex flex-wrap gap-1">
								{state.selectedItems.map((item) => (
									<Chip
										className="font-medium"
										key={item.key}
										size="sm"
										variant="soft"
									>
										{item.textValue}
									</Chip>
								))}
							</div>
						);
					}}
				</Select.Value>
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox selectionMode="multiple">
					{values.map((val) => (
						<ListBox.Item id={val} key={val} textValue={val}>
							<div className="whitespace-pre-wrap">{val}</div>
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
