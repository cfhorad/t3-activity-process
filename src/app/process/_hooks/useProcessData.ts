"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export function useProcessData() {
	const utils = api.useUtils();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({});

	const { data: syncedData, isLoading: isQueryLoading } =
		api.googleSheet.getAll.useQuery({
			search: debouncedSearch,
			filters: selectedFilters,
		});

	const { data: config } = api.googleSheet.getColumns.useQuery();

	const syncMutation = api.googleSheet.sync.useMutation({
		onSuccess: (data) => {
			void utils.googleSheet.getAll.invalidate();
			void utils.googleSheet.getColumns.invalidate();
			console.log(`Synced ${data.rowCount} rows and ${data.colCount} columns`);
		},
	});

	// Handle search debounce
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(handler);
	}, [search]);

	const handleSync = () => {
		syncMutation.mutate();
	};

	const filterableColumns = config?.filter((c) => c.isFilterable) ?? [];

	const updateFilter = (columnName: string, values: string[]) => {
		setSelectedFilters((prev) => ({
			...prev,
			[columnName]: values,
		}));
	};

	return {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
	};
}
