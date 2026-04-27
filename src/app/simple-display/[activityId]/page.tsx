"use client";

import { Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { ActivityHeader } from "../../_components/ActivityHeader";

export default function SimpleDisplayPage() {
	const params = useParams();
	const activityId = params.activityId as string;

	const { data: activity } = api.activity.get.useQuery({ id: activityId });
	const { data: syncedData, isLoading: isQueryLoading } =
		api.googleSheet.getAll.useQuery({
			activityId,
		});
	const { data: columns } = api.googleSheet.getColumns.useQuery({ activityId });

	if (!activity && !isQueryLoading) {
		return <div className="p-8 text-center">Activity not found</div>;
	}

	return (
		<main className="container mx-auto flex flex-col gap-6 p-4 md:p-8">
			<ActivityHeader
				modeLabel="Simple Display"
				title={activity?.name ?? "Loading..."}
			/>

			<div className="w-full overflow-hidden border-white/10 border-t border-l bg-black/40">
				{isQueryLoading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="flex flex-col items-center gap-2">
							<Spinner />
							<span className="text-sm text-white/60">Loading data...</span>
						</div>
					</div>
				) : syncedData &&
					syncedData.length > 0 &&
					columns &&
					columns.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left text-sm">
							<thead className="bg-white/5 uppercase tracking-wider">
								<tr>
									{columns.map((col) => (
										<th
											className="border-white/10 border-r border-b px-4 py-2 font-bold text-white/80"
											key={col.columnName}
										>
											{col.columnName}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{syncedData.map((row) => {
									return (
										<tr className="hover:bg-white/5" key={row.id}>
											{columns.map((col) => {
												return (
													<td
														className="border-white/10 border-r border-b px-4 py-2"
														key={`${row.id}-${col.columnName}`}
													>
														{String(
															(row.data as Record<string, unknown>)[
																col.columnName
															] ?? "",
														)}
													</td>
												);
											})}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
						<p className="font-semibold text-xl">No Data Available</p>
						<p className="text-white/60">
							Please ensure the activity was successfully synced from the dashboard.
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
