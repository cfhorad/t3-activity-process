"use client";

import { toast } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";

export function useCheckData(processId: number) {
	const utils = api.useUtils();
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedFilters, setSelectedFilters] = useState<
		Record<string, string[]>
	>({});
	const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(false);
	const [visibleColumnNames, setVisibleColumnNames] = useState<string[]>([]);

	const { data: syncedData, isLoading: isQueryLoading, refetch: refetchData } =
		api.checkSheet.getAll.useQuery({
			processId,
			search: debouncedSearch,
			filters: selectedFilters,
		});

	const { data: columns } = api.checkSheet.getColumns.useQuery({ processId });

	// Initialize visible columns when data is loaded
	useEffect(() => {
		if (columns && visibleColumnNames.length === 0) {
			const initialVisible = columns
				.filter((c) => (c as { isVisible: boolean }).isVisible)
				.map((c) => c.columnName);
			setVisibleColumnNames(initialVisible);
		}
	}, [columns, visibleColumnNames.length]);

	const syncMutation = api.checkSheet.sync.useMutation({
		onSuccess: (data) => {
			void utils.checkSheet.getAll.invalidate({ processId });
			void utils.checkSheet.getColumns.invalidate({ processId });
			toast.success(`成功同步 ${data.rowCount} 筆資料`);
		},
		onError: (error) => {
			toast.danger(`同步失敗: ${error.message}`);
		},
	});

	const saveVisibleColumnsMutation =
		api.checkSheet.updateVisibleColumns.useMutation({
			onSuccess: () => {
				void utils.checkSheet.getColumns.invalidate({ processId });
				toast.success("已儲存可見欄位設定");
			},
			onError: (error) => {
				toast.danger(`儲存失敗: ${error.message}`);
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
			toast.danger(`更新失敗: ${err.message}`);
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

	const visibleColumns =
		columns?.filter((c) => visibleColumnNames.includes(c.columnName)) ?? [];

	const sortedData = useMemo(() => {
		return syncedData ? [...syncedData].sort((a, b) => a.id - b.id) : [];
	}, [syncedData]);

	const handleSaveVisibleColumns = () => {
		saveVisibleColumnsMutation.mutate({
			processId,
			visibleColumnNames,
		});
	};

	const handleManualRefetch = async () => {
		try {
			await refetchData();
			toast.success("統計數據已更新至最新");
		} catch {
			toast.danger("更新數據失敗，請稍後再試");
		}
	};

	return {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		sortedData,
		columns: columns ?? [],
		visibleColumns,
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
		updateCheckbox,
		visibleColumnNames,
		setVisibleColumnNames,
		handleSaveVisibleColumns,
		isSavingVisibleColumns: saveVisibleColumnsMutation.isPending,
		handleManualRefetch,
	};
}
