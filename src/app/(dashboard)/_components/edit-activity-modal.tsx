"use client";

import { ActivityFormModal } from "./activity-form-modal";
import type { ActivityFormData } from "./activity-form-schema";

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
	onSubmit: (data: ActivityFormData) => void;
	isPending: boolean;
}

export function EditActivityModal({
	activity,
	isOpen,
	onClose,
	onOpenChange,
	onSubmit,
	isPending,
}: EditActivityModalProps) {
	return (
		<ActivityFormModal
			initialData={activity}
			isOpen={isOpen}
			isPending={isPending}
			mode="edit"
			onClose={onClose}
			onOpenChange={onOpenChange}
			onSubmit={onSubmit}
			submitLabel="Save Changes"
			title="Edit Activity"
		/>
	);
}
