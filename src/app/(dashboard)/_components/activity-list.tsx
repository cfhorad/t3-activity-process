"use client";

import { Spinner } from "@heroui/react";
import { LayoutGrid } from "lucide-react";
import type { User } from "~/server/better-auth/config";
import { useActivities } from "../_hooks/useActivities";
import { ActivityCard } from "./activity-card";

export function ActivityList({ user }: { user: User }) {
	const { activities, isLoading } = useActivities();

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner size="lg" />
					<span className="text-muted-foreground text-small">
						載入活動中...
					</span>
				</div>
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-12 text-center">
				<LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-bold text-xl">尚未建立任何活動</h3>
				<p className="text-muted-foreground">建立您的第一個活動以開始使用。</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{activities.map((activity) => (
				<ActivityCard activity={activity} key={activity.id} user={user} />
			))}
		</div>
	);
}
