"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export function useProcessData(processId: number) {
	const utils = api.useUtils();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({});
	const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(false);

	const { data: syncedData, isLoading: isQueryLoading } =
		api.googleSheet.getAll.useQuery({
			processId,
			search: debouncedSearch,
			filters: selectedFilters,
		});

	const { data: config } = api.googleSheet.getColumns.useQuery({ processId });

	const syncMutation = api.googleSheet.sync.useMutation({
		onSuccess: (data) => {
			void utils.googleSheet.getAll.invalidate({ processId });
			void utils.googleSheet.getColumns.invalidate({ processId });
			console.log(`Synced ${data.rowCount} rows and ${data.colCount} columns`);
		},
	});

	// Auto-trigger sync if data is empty and no filters are active
	useEffect(() => {
		const hasActiveFilters = Object.values(selectedFilters).some(
			(v) => v.length > 0,
		);

		if (
			!isQueryLoading &&
			syncedData &&
			syncedData.length === 0 &&
			!syncMutation.isPending &&
			!hasAttemptedAutoSync &&
			search === "" &&
			!hasActiveFilters
		) {
			setHasAttemptedAutoSync(true);
			syncMutation.mutate({ processId });
		}
	}, [
		isQueryLoading,
		syncedData,
		syncMutation.isPending,
		hasAttemptedAutoSync,
		search,
		selectedFilters,
		processId,
		syncMutation,
	]);

	// Handle search debounce
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(handler);
	}, [search]);

	const handleSync = () => {
		syncMutation.mutate({ processId });
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
