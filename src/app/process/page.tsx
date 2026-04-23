"use client";

import { Button, Card, SearchField, Spinner } from "@heroui/react";
import { Search } from "lucide-react";
import { FilterSelect } from "./_components/FilterSelect";
import { ProcessCard } from "./_components/ProcessCard";
import { ProcessHeader } from "./_components/ProcessHeader";
import { SkeletonGrid } from "./_components/SkeletonGrid";
import { useProcessData } from "./_hooks/useProcessData";

export default function ProcessPage() {
	const {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
	} = useProcessData();

	return (
		<main className="container mx-auto flex flex-col gap-6 p-4 md:p-8">
			<ProcessHeader isSyncing={syncMutation.isPending} onSync={handleSync} />

			<div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
				<SearchField
					className="w-full"
					onChange={setSearch}
					value={search}
					variant="secondary"
				>
					<SearchField.Group>
						<SearchField.SearchIcon>
							<Search className="size-4 text-muted-foreground" />
						</SearchField.SearchIcon>
						<SearchField.Input placeholder="Search all data..." />
						<SearchField.ClearButton />
					</SearchField.Group>
				</SearchField>

				<div className="flex flex-col flex-wrap gap-4 sm:flex-row">
					{filterableColumns.map((col) => (
						<FilterSelect
							columnName={col.columnName}
							key={col.columnName}
							onSelectionChange={(values) =>
								updateFilter(col.columnName, values)
							}
							selectedKeys={selectedFilters[col.columnName] ?? []}
						/>
					))}
				</div>
			</div>

			<Card className="mx-auto w-full max-w-2xl border-none bg-content1 shadow-md">
				{isQueryLoading ? (
					<SkeletonGrid />
				) : syncedData && syncedData.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 p-4">
						{syncedData.map((row) => (
							<ProcessCard key={row.id} row={row} />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
						<div className="rounded-full bg-default-100 p-4">
							<Spinner className="opacity-50" color="current" size="sm" />
						</div>
						<div className="space-y-1">
							<p className="font-semibold text-xl">No Data Synced</p>
							<p className="mx-auto max-w-xs text-muted-foreground">
								Your local database is currently empty. Start by syncing from
								Google Sheets.
							</p>
						</div>
						<Button
							isPending={syncMutation.isPending}
							onPress={handleSync}
							variant="tertiary"
						>
							{({ isPending }) => (
								<>
									{isPending && <Spinner color="current" size="sm" />}
									Start First Sync
								</>
							)}
						</Button>
					</div>
				)}
			</Card>
		</main>
	);
}
