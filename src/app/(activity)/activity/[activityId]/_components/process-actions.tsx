"use client";

import { Button, useOverlayState } from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "~/components/confirm-delete-dialog";
import { api } from "~/trpc/react";
import { EditProcessModal } from "./edit-process-modal";

interface Process {
	id: number;
	name: string;
	sheetName: string;
	type: "PROCESS" | "CHECK";
	activityId: number;
	processDate: string;
	processMemo?: string | null;
}

export function ProcessActions({
	process,
	userRole,
}: {
	process: Process;
	userRole: string;
}) {
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const utils = api.useUtils();

	const deleteProcess = api.process.delete.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId: process.activityId,
			});
			deleteState.close();
		},
	});

	if (userRole !== "ADMIN" && userRole !== "MANAGER") {
		return null;
	}

	return (
		<>
			<div className="flex gap-2">
				<Button
					isIconOnly
					onClick={(e) => {
						e.stopPropagation();
						editState.open();
					}}
					size="sm"
					variant="secondary"
				>
					<Pencil className="h-4 w-4" />
				</Button>
				<Button
					isIconOnly
					onClick={(e) => {
						e.stopPropagation();
						deleteState.open();
					}}
					size="sm"
					variant="danger-soft"
				>
					<Trash2 className="h-4 w-4 text-danger" />
				</Button>
			</div>

			<EditProcessModal
				isOpen={editState.isOpen}
				onClose={editState.close}
				onOpenChange={editState.setOpen}
				process={process}
			/>

			<ConfirmDeleteDialog
				confirmLabel="Delete Process"
				description={
					<p>
						Are you sure you want to delete <strong>{process.name}</strong>?
						This action will also delete all synced data for this process.
					</p>
				}
				isOpen={deleteState.isOpen}
				isPending={deleteProcess.isPending}
				onConfirm={() => deleteProcess.mutate({ id: process.id })}
				onOpenChange={deleteState.setOpen}
				title="Delete Process?"
			/>
		</>
	);
}
