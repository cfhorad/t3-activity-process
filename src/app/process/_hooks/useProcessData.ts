"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export function useProcessData(activityId: string) {
	const utils = api.useUtils();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({});

	const { data: syncedData, isLoading: isQueryLoading } =
		api.googleSheet.getAll.useQuery(
			{
				activityId,
				search: debouncedSearch,
				filters: selectedFilters,
			},
			{ enabled: !!activityId },
		);

	const { data: config } = api.googleSheet.getColumns.useQuery(
		{ activityId },
		{ enabled: !!activityId },
	);

	const syncMutation = api.googleSheet.sync.useMutation({
		onSuccess: (data) => {
			void utils.googleSheet.getAll.invalidate({ activityId });
			void utils.googleSheet.getColumns.invalidate({ activityId });
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
		syncMutation.mutate({ activityId });
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
