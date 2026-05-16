"use client";

import { SearchField } from "@heroui/react";
import { Search } from "lucide-react";
import { FilterSelect } from "./filter-select";

interface FilterableColumn {
	columnName: string;
}

interface DataFilterToolbarProps {
	processId: number;
	search: string;
	onSearchChange: (value: string) => void;
	filterableColumns: FilterableColumn[];
	selectedFilters: Record<string, string[]>;
	onFilterChange: (columnName: string, values: string[]) => void;
	searchPlaceholder?: string;
	filterType?: "google" | "check";
}

export function DataFilterToolbar({
	processId,
	search,
	onSearchChange,
	filterableColumns,
	selectedFilters,
	onFilterChange,
	searchPlaceholder = "搜尋所有數據...",
	filterType = "google",
}: DataFilterToolbarProps) {
	const filterCount = filterableColumns.length;

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col items-end gap-4 sm:flex-row">
			<SearchField
				aria-label={searchPlaceholder}
				className={`w-full ${filterCount === 1 ? "sm:w-1/2" : "sm:w-1/3"}`}
				onChange={onSearchChange}
				value={search}
				variant="secondary"
			>
				<SearchField.Group>
					<SearchField.SearchIcon>
						<Search className="size-4 text-muted-foreground" />
					</SearchField.SearchIcon>
					<SearchField.Input placeholder={searchPlaceholder} />
					<SearchField.ClearButton />
				</SearchField.Group>
			</SearchField>

			<div
				className={`grid w-full gap-4 ${
					filterCount >= 3
						? "grid-cols-2 sm:grid-cols-3"
						: filterCount === 2
							? "grid-cols-2"
							: "grid-cols-1"
				} ${filterCount === 1 ? "sm:w-1/2" : "sm:w-2/3"}`}
			>
				{filterableColumns.map((col) => (
					<FilterSelect
						className="w-full"
						columnName={col.columnName}
						key={col.columnName}
						onSelectionChange={(values) =>
							onFilterChange(col.columnName, values)
						}
						processId={processId}
						selectedKeys={selectedFilters[col.columnName] ?? []}
						type={filterType}
					/>
				))}
			</div>
		</div>
	);
}
