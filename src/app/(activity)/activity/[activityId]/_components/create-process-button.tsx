"use client";

import { Button, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { api } from "~/trpc/react";
import { ProcessFormModal } from "./process-form-modal";

export function CreateProcessButton({
	activityId,
	userRole,
	variant = "primary",
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
				aria-label="新增程序"
				className={`${className} rounded-full`}
				isIconOnly
				onPress={state.open}
				size={size}
				variant={variant}
			>
				<Plus className="h-5 w-5" />
			</Button>

			<ProcessFormModal
				activityId={activityId}
				description="從試算表中新增分頁（Sheet）以進行追蹤管理。"
				isOpen={state.isOpen}
				isPending={createProcess.isPending}
				mode="create"
				onClose={state.close}
				onOpenChange={state.setOpen}
				onSubmit={(data) => createProcess.mutate({ ...data, activityId })}
				submitLabel="建立程序"
				title="建立程序"
			/>
		</>
	);
}
