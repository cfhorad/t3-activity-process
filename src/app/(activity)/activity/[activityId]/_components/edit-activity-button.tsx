"use client";

import { Button, Tooltip, useOverlayState } from "@heroui/react";
import { Settings } from "lucide-react";
import { ActivityFormModal } from "~/app/_components/activity-form-modal";
import type { User } from "~/server/better-auth/config";
import type { Activity } from "~/server/db/schema";
import { api } from "~/trpc/react";

interface ExtendedActivity extends Activity {
	creator?: { name: string | null } | null;
	processes?: { id: number }[];
	area?: { id: string; name: string } | null;
	leaders?: { userId: string }[];
}

export function EditActivityButton({
	activity,
	user,
	variant = "secondary",
	size = "md",
	className,
}: {
	activity: ExtendedActivity;
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
	const state = useOverlayState();
	const utils = api.useUtils();

	const updateActivity = api.activity.update.useMutation({
		onSuccess: () => {
			void utils.activity.getById.invalidate({ id: activity.id });
			void utils.activity.getAll.invalidate();
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
						aria-label="活動設定"
						className={`${className} rounded-full`}
						isIconOnly
						onPress={state.open}
						size={size}
						variant={variant}
					>
						<Settings className="h-5 w-5 animate-hover-spin" />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content placement="bottom">活動設定</Tooltip.Content>
			</Tooltip>

			<ActivityFormModal
				initialData={{
					...activity,
					areaId: activity.areaId ?? "",
					leaderUserIds: activity.leaders?.map((l) => l.userId) ?? [],
				}}
				isOpen={state.isOpen}
				isPending={updateActivity.isPending}
				mode="edit"
				onClose={state.close}
				onOpenChange={state.setOpen}
				onSubmit={(data) => updateActivity.mutate({ ...data, id: activity.id })}
				submitLabel="儲存變更"
				title="編輯活動設定"
				user={user}
			/>
		</>
	);
}
