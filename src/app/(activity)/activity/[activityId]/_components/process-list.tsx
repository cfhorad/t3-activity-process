"use client";

import { Spinner } from "@heroui/react";
import { TableProperties } from "lucide-react";
import type { User } from "~/server/better-auth/config";
import { useProcessList } from "../_hooks/useProcessList";
import { ProcessCard } from "./process-card";

export function ProcessList({
	activityId,
	user,
	activity,
}: {
	activityId: number;
	user: User;
	activity: {
		googleSheetId: string;
		createdById: string;
		areaId: string | null;
		creator?: { name: string | null } | null;
		createdAt: Date;
	};
}) {
	const { processes, isLoading } = useProcessList({ activityId });

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner />
					<span className="text-muted-foreground text-small">
						正在載入項目...
					</span>
				</div>
			</div>
		);
	}

	if (!processes || processes.length === 0) {
		return (
			<div className="flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-8 text-center">
				<TableProperties className="mb-4 h-10 w-10 text-muted-foreground" />
				<h3 className="font-bold text-xl">尚未建立任何項目</h3>
				<p className="text-muted-foreground text-small">
					新增一個項目以開始從試算表同步數據。
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{processes.map((process) => (
				<ProcessCard
					activity={activity}
					key={process.id}
					process={process}
					user={user}
				/>
			))}
		</div>
	);
}
