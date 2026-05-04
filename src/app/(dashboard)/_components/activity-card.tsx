"use client";

import { Button, buttonVariants, Card, useOverlayState } from "@heroui/react";
import { Calendar, LayoutGrid, Pencil, Trash2, User } from "lucide-react";
import Link from "next/link";
import { ConfirmDeleteDialog } from "~/components/confirm-delete-dialog";
import { api } from "~/trpc/react";
import { EditActivityModal } from "./edit-activity-modal";

interface ActivityCardProps {
	activity: {
		id: number;
		name: string;
		googleSheetId: string;
		createdAt: Date;
		creator?: {
			name: string;
		} | null;
	};
	userRole: string;
}

export function ActivityCard({ activity, userRole }: ActivityCardProps) {
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

	return (
		<>
			<Card className="bg-content1 transition-colors hover:bg-content2">
				<Card.Header className="flex gap-3 px-6 pt-6 pb-2">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<LayoutGrid className="h-6 w-6" />
					</div>
					<div className="flex flex-1 items-center justify-between">
						<div className="flex flex-col overflow-hidden">
							<Card.Title className="truncate font-bold text-md">
								{activity.name}
							</Card.Title>
							<Card.Description className="truncate text-muted-foreground text-small">
								ID: {activity.googleSheetId}
							</Card.Description>
						</div>
						{isAuthorized && (
							<div className="flex gap-1">
								<Button
									isIconOnly
									onPress={editState.open}
									size="sm"
									variant="secondary"
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									isIconOnly
									onPress={deleteState.open}
									size="sm"
									variant="danger-soft"
								>
									<Trash2 className="h-4 w-4 text-danger" />
								</Button>
							</div>
						)}
					</div>
				</Card.Header>
				<Card.Content className="px-6 py-4">
					<div className="flex items-center gap-2 text-muted-foreground text-small">
						<User className="h-4 w-4" />
						<span>Created by: {activity.creator?.name ?? "Unknown"}</span>
					</div>
					<div className="mt-2 flex items-center gap-2 text-muted-foreground text-small">
						<Calendar className="h-4 w-4" />
						<span>{new Date(activity.createdAt).toLocaleDateString()}</span>
					</div>
				</Card.Content>
				<Card.Footer className="px-6 pt-2 pb-6">
					<Link
						className={buttonVariants({
							variant: "secondary",
							size: "sm",
							fullWidth: true,
						})}
						href={`/activity/${activity.id}`}
					>
						View Processes
					</Link>
				</Card.Footer>
			</Card>

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
