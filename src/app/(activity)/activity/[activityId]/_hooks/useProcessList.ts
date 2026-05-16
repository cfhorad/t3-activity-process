"use client";

import { api } from "~/trpc/react";

export function useProcessList({ activityId }: { activityId: number }) {
	const { data: processes, isLoading } = api.process.getByActivityId.useQuery({
		activityId,
	});

	return {
		processes,
		isLoading,
	};
}
