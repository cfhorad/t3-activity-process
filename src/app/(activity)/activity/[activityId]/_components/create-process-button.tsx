"use client";

import { Button, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { api } from "~/trpc/react";
import { ProcessFormModal } from "./process-form-modal";

export function CreateProcessButton({
	activityId,
	userRole,
	variant = "secondary",
	size = "md",
	className,
}: {
	activityId: number;
	userRole: string;
	variant?:
		| "primary"
		| "secondary"
		| "tertiary"
		| "danger"
		| "danger-soft"
		| "ghost"
		| "outline";
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	const state = useOverlayState();
	const utils = api.useUtils();

	const createProcess = api.process.create.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({ activityId });
			state.close();
		},
	});

	const normalizedRole = userRole?.toUpperCase();
	if (normalizedRole !== "ADMIN" && normalizedRole !== "MANAGER") {
		return null;
	}

	return (
		<>
			<Button
				className={className}
				onPress={state.open}
				size={size}
				variant={variant}
			>
				<Plus className="h-5 w-5" />
				New Process
			</Button>

			<ProcessFormModal
				activityId={activityId}
				description="Add a new sheet (tab) from the spreadsheet to track."
				isOpen={state.isOpen}
				isPending={createProcess.isPending}
				mode="create"
				onClose={state.close}
				onOpenChange={state.setOpen}
				onSubmit={(data) => createProcess.mutate({ ...data, activityId })}
				submitLabel="Create Process"
				title="Create Process"
			/>
		</>
	);
}
