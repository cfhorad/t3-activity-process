"use client";

import { useOverlayState } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/components/confirm-delete-dialog";
import { api } from "~/trpc/react";
import { DashboardItemCard } from "../../_components/dashboard-item-card";
import { EditActivityModal } from "./edit-activity-modal";

interface ActivityCardProps {
	activity: {
		id: number;
		name: string;
		googleSheetId: string;
		activityDate: string;
		activityMemo?: string | null;
		processes?: { id: number }[];
	};
	userRole: string;
}

export function ActivityCard({ activity, userRole }: ActivityCardProps) {
	const router = useRouter();
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const utils = api.useUtils();

	const deleteActivity = api.activity.delete.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
			deleteState.close();
		},
	});

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
				title={activity.name}
			/>

			<EditActivityModal
				activity={activity}
				isOpen={editState.isOpen}
				onClose={editState.close}
				onOpenChange={editState.setOpen}
			/>

			<ConfirmDeleteDialog
				confirmLabel="Delete Activity"
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
				title="Delete Activity?"
			/>
		</>
	);
}
