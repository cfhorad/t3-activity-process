"use client";

import { Button, Tooltip, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import type { User } from "~/server/better-auth/config";
import { api } from "~/trpc/react";
import { ProcessFormModal } from "./process-form-modal";

export function CreateProcessButton({
	activity,
	user,
	variant = "primary",
	size = "md",
	className,
}: {
	activity: { id: number; createdById: string; areaId: string | null };
	user: User;
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
	const activityId = activity.id;
	const state = useOverlayState();
	const utils = api.useUtils();

	const createProcess = api.process.create.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({ activityId });
			state.close();
		},
	});

	const role = user?.role?.toUpperCase();
	const userId = user?.id;
	const userAreaId = user?.areaId;

	const isCreator = activity.createdById === userId;
	const isAreaAdmin =
		role === "ADMIN" &&
		(userAreaId === "ALL" || activity.areaId === userAreaId);

	if (!isCreator && !isAreaAdmin) {
		return null;
	}

	return (
		<>
			<Tooltip delay={0}>
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
				<Tooltip.Content placement="bottom">新增程序</Tooltip.Content>
			</Tooltip>

			<ProcessFormModal
				activityId={activityId}
				description="從試算表中新增分頁（Sheet）以進行管理。"
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
