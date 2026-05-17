"use client";

import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/app/_components/confirm-delete-dialog";
import type { User } from "~/server/better-auth/config";
import type { Activity } from "~/server/db/schema";
import { DashboardItemCard } from "../../_components/dashboard-item-card";
import { useActivityActions } from "../_hooks/useActivityActions";
import { ActivityInfoModal } from "./activity-info-modal";
import { EditActivityModal } from "./edit-activity-modal";

interface ActivityCardProps {
	activity: Activity & {
		creator?: { name: string | null } | null;
		processes?: { id: number }[];
	};
	user: User;
}

export function ActivityCard({ activity, user }: ActivityCardProps) {
	const router = useRouter();
	const { editState, deleteState, infoState, deleteActivity, updateActivity } =
		useActivityActions();

	const role = user?.role?.toUpperCase();
	const userId = user?.id;
	const userAreaId = user?.areaId;

	const isCreator = activity.createdById === userId;
	const isAreaAdmin =
		role === "ADMIN" &&
		(userAreaId === "ALL" || activity.areaId === userAreaId);

	const isAuthorized = isCreator || isAreaAdmin;

	const linkHref = `/activity/${activity.id}`;

	return (
		<>
			<DashboardItemCard
				date={activity.activityDate}
				description={activity.activityMemo}
				icon="meteocons:wind-offshore"
				onClick={() => router.push(linkHref)}
				onDelete={isAuthorized ? () => deleteState.open() : undefined}
				onEdit={isAuthorized ? () => editState.open() : undefined}
				onInfo={() => infoState.open()}
				title={activity.name}
			/>

			<EditActivityModal
				activity={activity}
				isOpen={editState.isOpen}
				isPending={updateActivity.isPending}
				onClose={editState.close}
				onOpenChange={editState.setOpen}
				onSubmit={(data) => updateActivity.mutate({ ...data, id: activity.id })}
			/>

			<ConfirmDeleteDialog
				confirmLabel="Delete"
				description={
					<p>
						Are you sure you want to delete <strong>{activity.name}</strong>?
						This action will also delete all associated processes and synced
						data.
					</p>
				}
				isOpen={deleteState.isOpen}
				isPending={deleteActivity.isPending}
				onConfirm={() => deleteActivity.mutate({ id: activity.id })}
				onOpenChange={deleteState.setOpen}
				title="Delete Activity"
			/>

			<ActivityInfoModal
				activity={activity}
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
			/>
		</>
	);
}
