"use client";

import { Chip, useOverlayState } from "@heroui/react";
import { useRouter } from "next/navigation";
import { DashboardItemCard } from "~/app/_components/dashboard-item-card";
import { ConfirmDeleteDialog } from "~/components/confirm-delete-dialog";
import { api } from "~/trpc/react";
import { EditProcessModal } from "./edit-process-modal";
import { ProcessInfoModal } from "./process-info-modal";

interface ProcessCardProps {
	process: {
		id: number;
		name: string;
		sheetName: string;
		type: "PROCESS" | "CHECK" | "WEB";
		activityId: number;
		processDate?: string | null;
		processMemo?: string | null;
		iframeSrc?: string | null;
	};
	userRole: string;
	activity: {
		googleSheetId: string;
		creator?: { name: string | null } | null;
		createdAt: Date;
	};
}

export function ProcessCard({ process, userRole, activity }: ProcessCardProps) {
	const router = useRouter();
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const infoState = useOverlayState();
	const utils = api.useUtils();

	const deleteProcess = api.process.delete.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId: process.activityId,
			});
			deleteState.close();
		},
	});

	const isAuthorized = userRole === "ADMIN" || userRole === "MANAGER";

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
				onClose={editState.close}
				onOpenChange={editState.setOpen}
				process={process}
			/>

			<ConfirmDeleteDialog
				confirmLabel="刪除程序"
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
				title="確定要刪除程序嗎？"
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
