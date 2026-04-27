"use client";

import { Card, SearchField, Spinner } from "@heroui/react";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { ActivityHeader } from "../../_components/ActivityHeader";
import { FilterSelect } from "../_components/FilterSelect";
import { ProcessCard } from "../_components/ProcessCard";
import { SkeletonGrid } from "../_components/SkeletonGrid";
import { useProcessData } from "../_hooks/useProcessData";

export default function ProcessPage() {
	const params = useParams();
	const activityId = params.activityId as string;

	const { data: activity } = api.activity.get.useQuery({ id: activityId });

	const {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		isQueryLoading,
		filterableColumns,
	} = useProcessData(activityId);

	return (
		<main className="container mx-auto flex flex-col gap-6 p-4 md:p-8">
			<ActivityHeader
				modeLabel="Process"
				title={activity?.name ?? "Processing"}
			/>

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
							activityId={activityId}
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
							<p className="font-semibold text-xl">No Data Available</p>
							<p className="mx-auto max-w-xs text-muted-foreground">
								Please ensure the activity was successfully synced from the dashboard.
							</p>
						</div>
					</div>
				)}
			</Card>
		</main>
	);
}
