"use client";

import { Card, SearchField, Spinner } from "@heroui/react";
import { Search } from "lucide-react";
import { use } from "react";
import { CheckHeader } from "./_components/CheckHeader";
import { CheckListTable } from "./_components/CheckListTable";
import { ColumnSelect } from "./_components/ColumnSelect";
import { FilterSelect } from "./_components/FilterSelect";
import { useCheckData } from "./_hooks/useCheckData";

export function CheckPageClient({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const { processId } = use(params);
	const id = parseInt(processId, 10);

	const {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		columns,
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
		updateCheckbox,
		visibleColumns,
		visibleColumnNames,
		setVisibleColumnNames,
	} = useCheckData(id);

	return (
		<main className="min-h-screen bg-linear-to-b from-background to-content2 p-4 md:p-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<CheckHeader
					isSyncing={syncMutation.isPending}
					onSync={handleSync}
					processId={id}
				/>

				<div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
					<SearchField
						aria-label="Search attendees"
						className="w-full"
						onChange={setSearch}
						value={search}
						variant="secondary"
					>
						<SearchField.Group>
							<SearchField.SearchIcon>
								<Search className="size-4 text-muted-foreground" />
							</SearchField.SearchIcon>
							<SearchField.Input placeholder="Search attendees..." />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>

					<div className="flex flex-col flex-wrap gap-4 sm:flex-row">
						<ColumnSelect
							columns={columns}
							onSelectionChange={setVisibleColumnNames}
							visibleColumnNames={visibleColumnNames}
						/>
						{filterableColumns.map((col: { columnName: string }) => (
							<FilterSelect
								columnName={col.columnName}
								key={col.columnName}
								onSelectionChange={(values: string[]) =>
									updateFilter(col.columnName, values)
								}
								processId={id}
								selectedKeys={selectedFilters[col.columnName] ?? []}
							/>
						))}
					</div>
				</div>

				<Card className="mx-auto w-full max-w-7xl overflow-hidden border-none bg-content1 shadow-md">
					{isQueryLoading ? (
						<div className="flex h-64 items-center justify-center">
							<Spinner size="lg" />
						</div>
					) : syncedData && syncedData.length > 0 ? (
						<CheckListTable
							columns={visibleColumns}
							data={syncedData}
							onCheckboxChange={updateCheckbox}
						/>
					) : (
						<div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
							<div className="rounded-full bg-default-100 p-4">
								<Spinner className="opacity-50" color="current" size="lg" />
							</div>
							<div className="space-y-1">
								<p className="font-semibold text-xl">
									{syncMutation.isPending
										? "Syncing Data..."
										: "No Data Synced"}
								</p>
								<p className="mx-auto max-w-xs text-muted-foreground">
									{syncMutation.isPending
										? "Please wait while we fetch the latest data from Google Sheets for the first time."
										: "Your local database is currently empty. Start by syncing from Google Sheets."}
								</p>
							</div>
						</div>
					)}
				</Card>
			</div>
		</main>
	);
}
