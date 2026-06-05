"use client";

import { api } from "~/trpc/react";

export function useActivities() {
	const { data: activities, isLoading } = api.activity.getAll.useQuery();

	return {
		activities,
		isLoading,
	};
}
