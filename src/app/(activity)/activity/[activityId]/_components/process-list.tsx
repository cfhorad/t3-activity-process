"use client";

import { Chip, Modal, Spinner } from "@heroui/react";
import {
	Calendar,
	ExternalLink,
	Info,
	TableProperties,
	User as UserIcon,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/app/_components/confirm-delete-dialog";
import { DashboardItemCard } from "~/app/_components/dashboard-item-card";
import { useAuth } from "~/app/_hooks/useAuth";
import type { Activity, Process } from "~/server/db/schema";
import { useProcessActions } from "../_hooks/useProcessActions";
import { useProcessList } from "../_hooks/useProcessList";
import { ProcessFormModal } from "./process-form-modal";

// ─── TYPES ───────────────────────────────────────────────────

interface ExtendedActivity extends Activity {
	creator?: { name: string | null } | null;
	editors?: { userId: string }[];
}

interface ExtendedProcess extends Process {
	checkers?: {
		userId: string;
		user?: { name: string | null; email: string | null } | null;
	}[];
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Process Info Details Modal Component
 */
interface ProcessInfoModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	process: ExtendedProcess;
	activity: ExtendedActivity;
}

function ProcessInfoModal({
	isOpen,
	onOpenChange,
	process,
	activity,
}: ProcessInfoModalProps) {
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
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
							<Info className="size-5" />
						</Modal.Icon>
						<Modal.Heading>詳情資訊</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 pb-6">
						<div className="grid gap-4 rounded-xl bg-surface-secondary p-4 text-sm">
							<div className="flex items-center justify-between border-separator border-b pb-2">
								<span className="font-semibold text-base text-foreground">
									{process.name}
								</span>
								<Chip color={getTypeColor()} size="sm" variant="soft">
									{getTypeLabel()}
								</Chip>
							</div>

							{process.type !== "WEB" && process.sheetName && (
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">
										CSV 資料來源
									</p>
									<Link
										className="inline-flex items-center gap-1.5 break-all font-medium text-accent text-xs hover:underline"
										href={process.sheetName}
										target="_blank"
									>
										<ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" />
										開啟發布的 CSV 連結
									</Link>
								</div>
							)}

							{process.type === "WEB" && process.iframeSrc && (
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">嵌入網址</p>
									<Link
										className="inline-flex items-center gap-1.5 break-all font-medium text-accent text-xs hover:underline"
										href={process.iframeSrc}
										target="_blank"
									>
										<ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" />
										開啟嵌入網頁
									</Link>
								</div>
							)}

							{process.type === "CHECK" && (
								<div className="space-y-1.5 border-separator border-t pt-2">
									<p className="flex items-center gap-1.5 font-semibold text-muted text-xs">
										<Users className="h-3.5 w-3.5 text-muted" />
										檢核人員
									</p>
									<div className="flex flex-wrap gap-1.5">
										{process.checkers && process.checkers.length > 0 ? (
											process.checkers.map((checker) => (
												<Chip
													className="font-medium"
													color="success"
													key={checker.userId}
													size="sm"
													variant="soft"
												>
													{checker.user?.name ??
														checker.user?.email ??
														"檢核人員"}
												</Chip>
											))
										) : (
											<span className="text-muted-foreground text-xs italic">
												尚未設定檢核人員
											</span>
										)}
									</div>
								</div>
							)}

							{process.processMemo && (
								<div className="space-y-1 border-separator border-t pt-2">
									<p className="font-semibold text-muted text-xs">備註說明</p>
									<p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
										{process.processMemo}
									</p>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4 border-separator border-t pt-2">
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">建立者</p>
									<div className="flex items-center gap-1.5">
										<UserIcon className="h-3.5 w-3.5 text-muted" />
										<span>{activity.creator?.name ?? "未知"}</span>
									</div>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-muted text-xs">執行日期</p>
									<div className="flex items-center gap-1.5">
										<Calendar className="h-3.5 w-3.5 text-muted" />
										<span>{process.processDate || "未設定"}</span>
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
 * 2. Individual Process Card Component
 */
interface ProcessCardProps {
	process: ExtendedProcess;
	activity: ExtendedActivity;
}

function ProcessCard({ process, activity }: ProcessCardProps) {
	const router = useRouter();
	const { editState, deleteState, infoState, deleteProcess, updateProcess } =
		useProcessActions({
			activityId: process.activityId,
		});

	const { isActivityEditor } = useAuth();
	const isAuthorized = isActivityEditor(
		activity.id,
		activity.createdById,
		activity.areaId,
	);

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
				onClick={() => {
					window.dispatchEvent(new CustomEvent("navigation-start"));
					router.push(
						process.type === "CHECK"
							? `/check/${process.id}`
							: process.type === "WEB"
								? `/web/${process.id}`
								: `/process/${process.id}`,
					);
				}}
				onDelete={isAuthorized ? () => deleteState.open() : undefined}
				onEdit={isAuthorized ? () => editState.open() : undefined}
				onInfo={() => infoState.open()}
				title={process.name}
			/>

			{/* Edit Process Modal - directly uses ProcessFormModal */}
			<ProcessFormModal
				activityId={process.activityId}
				initialData={process}
				isOpen={editState.isOpen}
				isPending={updateProcess.isPending}
				mode="edit"
				onClose={editState.close}
				onOpenChange={editState.setOpen}
				onSubmit={(data) => updateProcess.mutate({ ...data, id: process.id })}
				submitLabel="儲存變更"
				title="編輯程序"
			/>

			{/* Confirm Delete Dialog */}
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

			{/* Process Info Modal */}
			<ProcessInfoModal
				activity={activity}
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
				process={process}
			/>
		</>
	);
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function ProcessList({
	activityId,
	activity,
}: {
	activityId: number;
	activity: ExtendedActivity;
}) {
	const { processes, isLoading } = useProcessList({ activityId });

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner />
					<span className="text-muted text-small">正在載入項目...</span>
				</div>
			</div>
		);
	}

	if (!processes || processes.length === 0) {
		return (
			<div className="flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-separator border-dashed bg-surface/50 p-8 text-center">
				<TableProperties className="mb-4 h-10 w-10 text-muted" />
				<h3 className="font-bold text-xl">尚未建立任何項目</h3>
				<p className="text-muted text-small">
					新增一個項目以開始從試算表同步數據。
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{processes.map((process) => (
				<ProcessCard activity={activity} key={process.id} process={process} />
			))}
		</div>
	);
}
