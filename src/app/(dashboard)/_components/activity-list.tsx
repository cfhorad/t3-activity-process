"use client";

import { Modal, Spinner } from "@heroui/react";
import {
	Calendar,
	ExternalLink,
	Info,
	Layers,
	LayoutGrid,
	MapPin,
	User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityFormModal } from "~/app/_components/activity-form-modal";
import { ConfirmDeleteDialog } from "~/app/_components/confirm-delete-dialog";
import { DashboardItemCard } from "~/app/_components/dashboard-item-card";
import type { User } from "~/server/better-auth/config";
import type { Activity } from "~/server/db/schema";
import { useActivities } from "../_hooks/useActivities";
import { useActivityActions } from "../_hooks/useActivityActions";

// ─── TYPES ───────────────────────────────────────────────────

interface ExtendedActivity extends Activity {
	creator?: { name: string | null } | null;
	processes?: { id: number }[];
	area?: { id: string; name: string } | null;
	leaders?: { userId: string }[];
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Activity Detail Information Modal
 */
interface ActivityInfoModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	activity: ExtendedActivity;
}

function ActivityInfoModal({
	isOpen,
	onOpenChange,
	activity,
}: ActivityInfoModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
							<Info className="size-5" />
						</Modal.Icon>
						<Modal.Heading>活動詳情資訊</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 pb-6">
						<div className="grid gap-4 rounded-xl bg-surface-secondary p-4 text-sm">
							<div className="space-y-1">
								<p className="font-semibold text-muted text-xs">
									Google 試算表 ID
								</p>
								<Link
									className="flex items-center gap-1.5 break-all font-mono text-accent hover:underline"
									href={`https://docs.google.com/spreadsheets/d/${activity.googleSheetId}`}
									target="_blank"
								>
									<ExternalLink className="h-3.5 w-3.5 shrink-0" />
									{activity.googleSheetId}
								</Link>
							</div>

							<div className="grid grid-cols-2 gap-4 border-separator border-t pt-2">
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">建立者</p>
									<div className="flex items-center gap-1.5">
										<UserIcon className="h-3.5 w-3.5 text-muted" />
										<span>{activity.creator?.name ?? "未知"}</span>
									</div>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">建立日期</p>
									<div className="flex items-center gap-1.5">
										<Calendar className="h-3.5 w-3.5 text-muted" />
										<span>
											{new Date(activity.createdAt).toLocaleDateString("zh-TW")}
										</span>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 border-separator border-t pt-2">
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">營運分會</p>
									<div className="flex items-center gap-1.5">
										<MapPin className="h-3.5 w-3.5 text-muted" />
										<span className="font-medium text-primary">
											{activity.area ? activity.area.name : "未分配"}
										</span>
									</div>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">
										工作項目數量
									</p>
									<div className="flex items-center gap-1.5">
										<Layers className="h-3.5 w-3.5 text-muted" />
										<span className="font-medium text-danger">
											{activity.processes?.length ?? 0} 個項目
										</span>
									</div>
								</div>
							</div>
						</div>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

/**
 * 2. Individual Activity Card Component
 */
interface ActivityCardProps {
	activity: ExtendedActivity;
	user: User & { areaIds?: string[] };
}

function ActivityCard({ activity, user }: ActivityCardProps) {
	const router = useRouter();
	const { editState, deleteState, infoState, deleteActivity, updateActivity } =
		useActivityActions();

	const role = user?.role?.toUpperCase();
	const userId = user?.id;
	const areaIds = user?.areaIds ?? [];

	const isCreator = activity.createdById === userId;
	const isAreaAdmin =
		role === "ADMIN" ||
		(role === "MANAGER" &&
			activity.areaId !== null &&
			areaIds.includes(activity.areaId));

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

			{/* Edit Activity Modal - Directly rendered using ActivityFormModal */}
			<ActivityFormModal
				initialData={{
					...activity,
					areaId: activity.areaId ?? "",
					leaderUserIds: activity.leaders?.map((l) => l.userId) ?? [],
				}}
				isOpen={editState.isOpen}
				isPending={updateActivity.isPending}
				mode="edit"
				onClose={editState.close}
				onOpenChange={editState.setOpen}
				onSubmit={(data) => updateActivity.mutate({ ...data, id: activity.id })}
				submitLabel="儲存變更"
				title="編輯活動"
				user={user}
			/>

			{/* Confirm Delete Dialog */}
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

			{/* Activity Info Details Modal */}
			<ActivityInfoModal
				activity={activity}
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
			/>
		</>
	);
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function ActivityList({ user }: { user: User }) {
	const { activities, isLoading } = useActivities();

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner size="lg" />
					<span className="text-muted text-small">載入活動中...</span>
				</div>
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-separator border-dashed bg-surface/50 p-12 text-center">
				<LayoutGrid className="mb-4 h-12 w-12 text-muted" />
				<h3 className="font-bold text-xl">尚未建立任何活動</h3>
				<p className="text-muted">建立您的第一個活動以開始使用。</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{activities.map((activity) => (
				<ActivityCard activity={activity} key={activity.id} user={user} />
			))}
		</div>
	);
}
