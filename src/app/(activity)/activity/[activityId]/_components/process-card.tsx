"use client";

import { Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/app/_components/confirm-delete-dialog";
import { DashboardItemCard } from "~/app/_components/dashboard-item-card";
import type { User } from "~/server/better-auth/config";
import type { Activity, Process } from "~/server/db/schema";
import { useProcessActions } from "../_hooks/useProcessActions";
import { EditProcessModal } from "./edit-process-modal";
import { ProcessInfoModal } from "./process-info-modal";

interface ProcessCardProps {
	process: Process;
	user: User;
	activity: Activity & {
		creator?: { name: string | null } | null;
	};
}

export function ProcessCard({ process, user, activity }: ProcessCardProps) {
	const router = useRouter();
	const { editState, deleteState, infoState, deleteProcess, updateProcess } =
		useProcessActions({
			activityId: process.activityId,
		});

	const role = user?.role?.toUpperCase();
	const userId = user?.id;
	const userAreaId = user?.areaId;

	const isCreator = activity.createdById === userId;
	const isAreaAdmin =
		role === "ADMIN" &&
		(userAreaId === "ALL" || activity.areaId === userAreaId);

	const isAuthorized = isCreator || isAreaAdmin;

	const getIcon = () => {
		switch (process.type) {
			case "PROCESS":
				return "meteocons:rainbow-clear-fill";
			case "CHECK":
				return "meteocons:pollen-flower-fill";
			case "WEB":
				return "meteocons:starry-night-fill";
			default:
				return "meteocons:wind-offshore";
		}
	};

	const getTypeLabel = () => {
		switch (process.type) {
			case "CHECK":
				return "報到清單";
			case "WEB":
				return "網頁嵌入";
			case "PROCESS":
				return "流程處理";
		}
	};

	const getTypeColor = () => {
		switch (process.type) {
			case "CHECK":
				return "success";
			case "WEB":
				return "warning";
			case "PROCESS":
				return "accent";
		}
	};

	return (
		<>
			<DashboardItemCard
				chip={
					<Chip color={getTypeColor()} size="sm" variant="soft">
						{getTypeLabel()}
					</Chip>
				}
				date={process.processDate}
				description={process.processMemo}
				icon={getIcon()}
				onClick={() =>
					router.push(
						process.type === "CHECK"
							? `/check/${process.id}`
							: process.type === "WEB"
								? `/web/${process.id}`
								: `/process/${process.id}`,
					)
				}
				onDelete={isAuthorized ? () => deleteState.open() : undefined}
				onEdit={isAuthorized ? () => editState.open() : undefined}
				onInfo={() => infoState.open()}
				title={process.name}
			/>

			<EditProcessModal
				isOpen={editState.isOpen}
				isPending={updateProcess.isPending}
				onClose={editState.close}
				onOpenChange={editState.setOpen}
				onSubmit={(data) => updateProcess.mutate({ ...data, id: process.id })}
				process={process}
			/>

			<ConfirmDeleteDialog
				confirmLabel="刪除"
				description={
					<p>
						您確定要刪除 <strong>{process.name}</strong> 嗎？
						此操作也將刪除該程序的所有同步數據。
					</p>
				}
				isOpen={deleteState.isOpen}
				isPending={deleteProcess.isPending}
				onConfirm={() => deleteProcess.mutate({ id: process.id })}
				onOpenChange={deleteState.setOpen}
				title="刪除程序"
			/>

			<ProcessInfoModal
				activity={activity}
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
				process={process}
			/>
		</>
	);
}
