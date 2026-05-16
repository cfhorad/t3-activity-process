"use client";

import { api } from "~/trpc/react";
import { ProcessFormModal } from "./process-form-modal";

interface Process {
	id: number;
	name: string;
	sheetName: string;
	type: "PROCESS" | "CHECK" | "WEB";
	activityId: number;
	processDate?: string | null;
	processMemo?: string | null;
	iframeSrc?: string | null;
}

interface EditProcessModalProps {
	process: Process;
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
}

export function EditProcessModal({
	process,
	isOpen,
	onClose,
	onOpenChange,
}: EditProcessModalProps) {
	const utils = api.useUtils();

	const updateProcess = api.process.update.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId: process.activityId,
			});
			onClose();
		},
	});

	return (
		<ProcessFormModal
			activityId={process.activityId}
			initialData={process}
			isOpen={isOpen}
			isPending={updateProcess.isPending}
			mode="edit"
			onClose={onClose}
			onOpenChange={onOpenChange}
			onSubmit={(data) => updateProcess.mutate({ ...data, id: process.id })}
			submitLabel="儲存變更"
			title="編輯程序"
		/>
	);
}
