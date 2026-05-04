"use client";

import { api } from "~/trpc/react";
import { ActivityFormModal } from "./activity-form-modal";

interface Activity {
	id: number;
	name: string;
	googleSheetId: string;
	activityDate: string;
	activityMemo?: string | null;
}

interface EditActivityModalProps {
	activity: Activity;
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
}

export function EditActivityModal({
	activity,
	isOpen,
	onClose,
	onOpenChange,
}: EditActivityModalProps) {
	const utils = api.useUtils();

	const updateActivity = api.activity.update.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
			onClose();
		},
	});

	return (
		<ActivityFormModal
			initialData={activity}
			isOpen={isOpen}
			isPending={updateActivity.isPending}
			mode="edit"
			onClose={onClose}
			onOpenChange={onOpenChange}
			onSubmit={(data) => updateActivity.mutate({ ...data, id: activity.id })}
			submitLabel="Save Changes"
			title="Edit Activity"
		/>
	);
}
