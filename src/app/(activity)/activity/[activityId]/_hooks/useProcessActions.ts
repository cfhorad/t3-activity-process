"use client";

import { useOverlayState } from "@heroui/react";
import { api } from "~/trpc/react";

export function useProcessActions({ activityId }: { activityId: number }) {
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const infoState = useOverlayState();
	const utils = api.useUtils();

	const deleteProcess = api.process.delete.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId,
			});
			deleteState.close();
		},
	});

	const updateProcess = api.process.update.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId,
			});
			editState.close();
		},
	});

	return {
		editState,
		deleteState,
		infoState,
		deleteProcess,
		updateProcess,
	};
}
