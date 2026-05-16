"use client";

import { ProcessFormModal } from "./process-form-modal";
import type { ProcessFormData } from "./process-form-schema";

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
	onSubmit: (data: ProcessFormData & { iframeCode?: string }) => void;
	isPending: boolean;
}

export function EditProcessModal({
	process,
	isOpen,
	onClose,
	onOpenChange,
	onSubmit,
	isPending,
}: EditProcessModalProps) {
	return (
		<ProcessFormModal
			activityId={process.activityId}
			initialData={process}
			isOpen={isOpen}
			isPending={isPending}
			mode="edit"
			onClose={onClose}
			onOpenChange={onOpenChange}
			onSubmit={onSubmit}
			submitLabel="儲存變更"
			title="編輯程序"
		/>
	);
}
