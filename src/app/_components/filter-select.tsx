"use client";

import { Chip, Label, ListBox, Select, Spinner } from "@heroui/react";
import { api } from "~/trpc/react";

interface FilterSelectProps {
	type: "google" | "check";
	processId: number;
	columnName: string;
	selectedKeys: string[];
	onSelectionChange: (keys: string[]) => void;
	className?: string;
}

const ALL_KEY = "__ALL__";

export function FilterSelect({
	type,
	processId,
	columnName,
	selectedKeys,
	onSelectionChange,
	className,
}: FilterSelectProps) {
	const googleQuery = api.googleSheet.getUniqueValues.useQuery(
		{ processId, columnName },
		{ enabled: type === "google" },
	);

	const checkQuery = api.checkSheet.getUniqueValues.useQuery(
		{ processId, columnName },
		{ enabled: type === "check" },
	);

	const { data: values, isLoading } =
		type === "google" ? googleQuery : checkQuery;

	if (!values || (values.length === 0 && !isLoading)) return null;

	const currentKey = selectedKeys.length === 0 ? ALL_KEY : selectedKeys[0];

	return (
		<Select
			className={className}
			onChange={(val) => {
				if (val === ALL_KEY || val === null) {
					onSelectionChange([]);
				} else {
					onSelectionChange([String(val)]);
				}
			}}
			placeholder={`篩選：${columnName}`}
			selectionMode="single"
			value={currentKey}
			variant="primary"
		>
			<Label>{columnName}</Label>
			<Select.Trigger>
				<Select.Value>
					{({ isPlaceholder, state }) => {
						if (isLoading) {
							return (
								<div className="flex items-center gap-2">
									<Spinner size="sm" />
									<span className="text-muted-foreground">載入中...</span>
								</div>
							);
						}

						if (isPlaceholder || state.selectedItems.length === 0) {
							return `篩選：${columnName}`;
						}

						const item = state.selectedItems[0];
						return (
							<Chip className="font-medium" size="sm" variant="soft">
								{item?.textValue}
							</Chip>
						);
					}}
				</Select.Value>
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox selectionMode="single">
					<ListBox.Item id={ALL_KEY} key={ALL_KEY} textValue="全選">
						<div className="font-medium text-accent">全選</div>
						<ListBox.ItemIndicator />
					</ListBox.Item>
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
