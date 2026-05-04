"use client";

import { Spinner } from "@heroui/react";
import { LayoutGrid } from "lucide-react";
import { api } from "~/trpc/react";
import { ActivityCard } from "./activity-card";

export function ActivityList({ userRole }: { userRole: string }) {
	const { data: activities, isLoading } = api.activity.getAll.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner size="lg" />
					<span className="text-muted-foreground text-small">
						Loading activities...
					</span>
				</div>
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-12 text-center">
				<LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-bold text-xl">No activities found</h3>
				<p className="text-muted-foreground">
					Create your first activity to get started.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{activities.map((activity) => (
				<ActivityCard
					activity={activity}
					key={activity.id}
					userRole={userRole}
				/>
			))}
		</div>
	);
}
