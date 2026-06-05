"use client";

import { Button, Tooltip, useOverlayState } from "@heroui/react";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActivityFormModal } from "~/app/_components/activity-form-modal";
import { useAuth } from "~/app/_hooks/useAuth";
import type { Activity } from "~/server/db/schema";
import { api } from "~/trpc/react";

interface ExtendedActivity extends Activity {
	creator?: { name: string | null } | null;
	processes?: { id: number }[];
	area?: { id: string; name: string } | null;
	editors?: { userId: string }[];
}

export function EditActivityButton({
	activity,
	variant = "secondary",
	size = "md",
	className,
}: {
	activity: ExtendedActivity;
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
	const router = useRouter();

	const updateActivity = api.activity.update.useMutation({
		onSuccess: () => {
			void utils.activity.getById.invalidate({ id: activity.id });
			void utils.activity.getAll.invalidate();
			void utils.user.getMyPermissions.invalidate();
			router.refresh();
			state.close();
		},
	});

	const { isActivityEditor } = useAuth();
	const isAuthorized = isActivityEditor(
		activity.id,
		activity.createdById,
		activity.areaId,
	);

	if (!isAuthorized) {
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
					editorUserIds: activity.editors?.map((e) => e.userId) ?? [],
				}}
				isOpen={state.isOpen}
				isPending={updateActivity.isPending}
				mode="edit"
				onClose={state.close}
				onOpenChange={state.setOpen}
				onSubmit={(data) => updateActivity.mutate({ ...data, id: activity.id })}
				submitLabel="儲存變更"
				title="編輯活動設定"
			/>
		</>
	);
}
