"use client";

import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/app/_components/confirm-delete-dialog";
import { DashboardItemCard } from "../../_components/dashboard-item-card";
import { useActivityActions } from "../_hooks/useActivityActions";
import { ActivityInfoModal } from "./activity-info-modal";
import { EditActivityModal } from "./edit-activity-modal";

interface ActivityCardProps {
	activity: {
		id: number;
		name: string;
		googleSheetId: string;
		activityDate: string;
		activityMemo?: string | null;
		createdAt: Date;
		creator?: { name: string | null } | null;
		processes?: { id: number }[];
	};
	userRole: string;
}

export function ActivityCard({ activity, userRole }: ActivityCardProps) {
	const router = useRouter();
	const { editState, deleteState, infoState, deleteActivity, updateActivity } =
		useActivityActions({ activityId: activity.id });

	const normalizedRole = userRole?.toUpperCase();
	const isAuthorized =
		normalizedRole === "ADMIN" || normalizedRole === "MANAGER";

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
