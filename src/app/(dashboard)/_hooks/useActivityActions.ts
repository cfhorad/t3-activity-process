"use client";

import { useOverlayState } from "@heroui/react";
import { api } from "~/trpc/react";

export function useActivityActions({
	activityId,
}: {
	activityId: number;
}) {
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const infoState = useOverlayState();
	const utils = api.useUtils();

	const deleteActivity = api.activity.delete.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
			deleteState.close();
		},
	});

	const updateActivity = api.activity.update.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
			editState.close();
		},
	});

	return {
		editState,
		deleteState,
		infoState,
		deleteActivity,
		updateActivity,
	};
}
