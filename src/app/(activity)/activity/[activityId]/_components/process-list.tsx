"use client";

import { Spinner } from "@heroui/react";
import { TableProperties } from "lucide-react";
import { api } from "~/trpc/react";
import { ProcessCard } from "./process-card";

export function ProcessList({
	activityId,
	userRole,
}: {
	activityId: number;
	userRole: string;
}) {
	const { data: processes, isLoading } = api.process.getByActivityId.useQuery({
		activityId,
	});

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner />
					<span className="text-muted-foreground text-small">
						Loading processes...
					</span>
				</div>
			</div>
		);
	}

	if (!processes || processes.length === 0) {
		return (
			<div className="flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-8 text-center">
				<TableProperties className="mb-4 h-10 w-10 text-muted-foreground" />
				<h3 className="font-bold">No processes defined</h3>
				<p className="text-muted-foreground text-small">
					Add a process to start syncing data from sheets.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4">
			{processes.map((process) => (
				<ProcessCard key={process.id} process={process} userRole={userRole} />
			))}
		</div>
	);
}
