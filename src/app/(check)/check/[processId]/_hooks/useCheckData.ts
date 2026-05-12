"use client";

import { toast } from "@heroui/react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export function useCheckData(processId: number) {
	const utils = api.useUtils();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({});
	const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(false);

	const { data: syncedData, isLoading: isQueryLoading } =
		api.checkSheet.getAll.useQuery({
			processId,
			search: debouncedSearch,
			filters: selectedFilters,
		});

	const { data: columns } = api.checkSheet.getColumns.useQuery({ processId });

	const syncMutation = api.checkSheet.sync.useMutation({
		onSuccess: (data) => {
			void utils.checkSheet.getAll.invalidate({ processId });
			void utils.checkSheet.getColumns.invalidate({ processId });
			toast.success(`Synced ${data.rowCount} rows successfully`);
		},
		onError: (error) => {
			toast.danger(`Sync failed: ${error.message}`);
		},
	});

	const updateCheckboxMutation = api.checkSheet.updateCheckbox.useMutation({
		onMutate: async ({ databaseId, columnName, newValue }) => {
			// Optimistic UI update
			await utils.checkSheet.getAll.cancel({
				processId,
				search: debouncedSearch,
				filters: selectedFilters,
			});
			const previousData = utils.checkSheet.getAll.getData({
				processId,
				search: debouncedSearch,
				filters: selectedFilters,
			});

			utils.checkSheet.getAll.setData(
				{ processId, search: debouncedSearch, filters: selectedFilters },
				(old) => {
					if (!old) return [];
					return old.map((row) => {
						if (row.id === databaseId) {
							return {
								...row,
								data: {
									...(row.data as Record<string, unknown>),
									[columnName]: newValue,
								},
							};
						}
						return row;
					});
				},
			);

			return { previousData };
		},
		onError: (err, _variables, context) => {
			if (context?.previousData) {
				utils.checkSheet.getAll.setData(
					{ processId, search: debouncedSearch, filters: selectedFilters },
					context.previousData,
				);
			}
			toast.danger(`Update failed: ${err.message}`);
		},
		onSettled: () => {
			void utils.checkSheet.getAll.invalidate({
				processId,
				search: debouncedSearch,
				filters: selectedFilters,
			});
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

	const filterableColumns = columns?.filter((c) => c.isFilterable) ?? [];

	const updateFilter = (columnName: string, values: string[]) => {
		setSelectedFilters((prev) => ({
			...prev,
			[columnName]: values,
		}));
	};

	const updateCheckbox = (
		databaseId: number,
		columnName: string,
		newValue: boolean,
	) => {
		updateCheckboxMutation.mutate({ databaseId, columnName, newValue });
	};

	return {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		columns: columns ?? [],
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
		updateCheckbox,
	};
}
