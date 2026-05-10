"use client";

import { Button, Card, useOverlayState } from "@heroui/react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/components/confirm-delete-dialog";
import { api } from "~/trpc/react";
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
			<Card
				className="group w-full cursor-pointer items-stretch transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:flex-row"
				onClick={() => router.push(linkHref)}
				variant="secondary"
			>
				<div className="relative h-[160px] w-full shrink-0 overflow-hidden rounded-t-2xl md:h-auto md:w-[200px] md:rounded-l-2xl md:rounded-tr-none">
					<Image
						alt={activity.name}
						className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-110"
						fill
						priority
						sizes="(max-width: 768px) 100vw, 200px"
						src="/images/activity-hero.png"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
				</div>

				<div className="flex flex-1 flex-col">
					<Card.Header className="flex flex-col items-start gap-1 px-6 pt-6">
						<div className="flex w-full items-center justify-between">
							<Card.Title className="truncate font-bold text-xl tracking-tight">
								{activity.name}
							</Card.Title>
						</div>
						<Card.Description className="flex w-full items-center justify-between gap-4 text-muted-foreground text-sm">
							<span className="line-clamp-1">{activity.activityMemo}</span>
							<span className="flex shrink-0 items-center gap-1.5 font-medium">
								<Calendar className="h-3.5 w-3.5" />
								<span>{activity.activityDate}</span>
							</span>
						</Card.Description>
					</Card.Header>

					<Card.Footer className="mt-auto flex items-center justify-end border-divider border-t px-6 py-4">
						{isAuthorized && (
							<div className="flex gap-2">
								<Button
									isIconOnly
									onPress={(e) => {
										e.continuePropagation();
										editState.open();
									}}
									size="sm"
									variant="secondary"
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									isIconOnly
									onPress={(e) => {
										e.continuePropagation();
										deleteState.open();
									}}
									size="sm"
									variant="danger-soft"
								>
									<Trash2 className="h-4 w-4 text-danger" />
								</Button>
							</div>
						)}
					</Card.Footer>
				</div>
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
