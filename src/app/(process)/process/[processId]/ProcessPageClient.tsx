"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { use } from "react";
import { DataFilterToolbar } from "~/app/_components/data-filter-toolbar";
import { ProcessCard } from "./_components/ProcessCard";
import { ProcessHeader } from "./_components/ProcessHeader";
import { SkeletonGrid } from "./_components/SkeletonGrid";
import { useProcessData } from "./_hooks/useProcessData";

export function ProcessPageClient({
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
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
	} = useProcessData(id);

	return (
		<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<ProcessHeader
					isSyncing={syncMutation.isPending}
					onSync={handleSync}
					processId={id}
				/>

				<DataFilterToolbar
					filterableColumns={filterableColumns}
					onFilterChange={updateFilter}
					onSearchChange={setSearch}
					processId={id}
					search={search}
					selectedFilters={selectedFilters}
				/>

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
							{!syncMutation.isPending && (
								<Button
									isPending={syncMutation.isPending}
									onPress={handleSync}
									variant="tertiary"
								>
									Start First Sync
								</Button>
							)}
						</div>
					)}
				</Card>
			</div>
		</main>
	);
}
