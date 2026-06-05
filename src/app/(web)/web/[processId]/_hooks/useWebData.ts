"use client";

import { api } from "~/trpc/react";

export function useWebData(processId: number) {
	const { data: process, isLoading } = api.process.getById.useQuery({
		id: processId,
	});

	return {
		process,
		isLoading,
	};
}
