"use client";

import { Accordion, Button, Card, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
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
				className="group flex w-full cursor-pointer flex-row items-stretch transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
				onClick={() => router.push(linkHref)}
				variant="secondary"
			>
				<div className="relative flex w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-l-2xl bg-linear-to-br from-zinc-900 to-accent/40 shadow-inner">
					<div className="absolute inset-0 bg-black/20" />
					<Icon
						className="relative z-10 size-24 text-white/90 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
						icon="meteocons:wind-offshore"
					/>
				</div>

				<div className="flex flex-1 flex-col">
					<Card.Header className="flex flex-col items-start gap-0.5 p-4 pb-2">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<Card.Title className="font-bold text-base tracking-tight">
								{activity.name}
							</Card.Title>
							<span className="flex items-center gap-1 text-muted-foreground text-xs">
								<span className="opacity-30">•</span>
								<Calendar className="h-3 w-3" />
								<span>
									{activity.activityDate}
									<span className="ml-1 opacity-70">
										(
										{new Intl.DateTimeFormat("zh-TW", {
											weekday: "short",
										}).format(new Date(activity.activityDate))}
										)
									</span>
								</span>
							</span>
						</div>
						<Card.Description className="line-clamp-1 text-muted-foreground text-xs">
							{activity.activityMemo}
						</Card.Description>
					</Card.Header>

					<Card.Content className="px-4 pt-0 pb-4">
						{isAuthorized && (
							<Accordion
								className="w-full"
								hideSeparator
								onClick={(e) => e.stopPropagation()}
							>
								<Accordion.Item id="actions">
									<Accordion.Heading>
										<Accordion.Trigger className="py-1 text-muted-foreground text-xs hover:text-foreground">
											更多操作
											<Accordion.Indicator />
										</Accordion.Trigger>
									</Accordion.Heading>
									<Accordion.Panel>
										<Accordion.Body className="flex gap-2 pt-2">
											<Button
												className="h-8 flex-1 text-xs"
												onPress={(e) => {
													e.continuePropagation();
													editState.open();
												}}
												variant="secondary"
											>
												<Pencil className="mr-1 h-3 w-3" />
												編輯
											</Button>
											<Button
												className="h-8 flex-1 text-xs"
												onPress={(e) => {
													e.continuePropagation();
													deleteState.open();
												}}
												variant="danger-soft"
											>
												<Trash2 className="mr-1 h-3 w-3 text-danger" />
												刪除
											</Button>
										</Accordion.Body>
									</Accordion.Panel>
								</Accordion.Item>
							</Accordion>
						)}
					</Card.Content>
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
