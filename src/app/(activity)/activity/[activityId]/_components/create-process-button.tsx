"use client";

import { Button, Tooltip, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import type { User } from "~/server/better-auth/config";
import type { Activity } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { ProcessFormModal } from "./process-form-modal";

export function CreateProcessButton({
	activity,
	user,
	variant = "primary",
	size = "md",
	className,
}: {
	activity: Pick<Activity, "id" | "createdById" | "areaId">;
	user: User & { areaIds?: string[] };
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
	const areaIds = user?.areaIds ?? [];

	const isCreator = activity.createdById === userId;
	const isAreaAdmin =
		role === "ADMIN" ||
		(role === "MANAGER" &&
			activity.areaId !== null &&
			areaIds.includes(activity.areaId));

	if (!isCreator && !isAreaAdmin) {
		return null;
	}

	return (
		<>
			<Tooltip closeDelay={0} delay={0}>
				<Tooltip.Trigger>
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
				</Tooltip.Trigger>
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
