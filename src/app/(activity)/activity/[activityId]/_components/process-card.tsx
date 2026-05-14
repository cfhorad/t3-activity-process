"use client";

import {
	Accordion,
	Button,
	Card,
	Chip,
	Modal,
	useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
	Calendar,
	ExternalLink,
	Info,
	Pencil,
	Trash2,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "~/components/confirm-delete-dialog";
import { api } from "~/trpc/react";
import { EditProcessModal } from "./edit-process-modal";

interface ProcessCardProps {
	process: {
		id: number;
		name: string;
		sheetName: string;
		type: "PROCESS" | "CHECK" | "WEB";
		activityId: number;
		processDate: string;
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
			<Card
				className="group flex w-full cursor-pointer flex-row items-stretch transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
				onClick={() =>
					router.push(
						process.type === "CHECK"
							? `/check/${process.id}`
							: process.type === "WEB"
								? `/web/${process.id}`
								: `/process/${process.id}`,
					)
				}
				variant="secondary"
			>
				<div className="relative flex w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-l-2xl bg-linear-to-br from-zinc-900 to-accent/40 shadow-inner md:w-[110px]">
					<div className="absolute inset-0 bg-black/20" />
					<Icon
						className="relative z-10 size-16 text-white/90 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] md:size-24"
						icon={getIcon()}
					/>
				</div>

				<div className="flex flex-1 flex-col">
					<Card.Header className="flex flex-col items-start gap-0.5 p-4 pb-2">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<Card.Title className="font-bold text-base tracking-tight">
								{process.name}
							</Card.Title>
							<Chip color={getTypeColor()} size="sm" variant="soft">
								{getTypeLabel()}
							</Chip>
							<span className="flex items-center gap-1 text-muted-foreground text-xs">
								<span className="opacity-30">•</span>
								<Calendar className="h-3 w-3" />
								<span>
									{process.processDate}
									<span className="ml-1 opacity-70">
										(
										{new Intl.DateTimeFormat("zh-TW", {
											weekday: "short",
										}).format(new Date(process.processDate))}
										)
									</span>
								</span>
							</span>
						</div>
						<Card.Description className="line-clamp-1 text-muted-foreground text-xs">
							{process.processMemo}
						</Card.Description>
					</Card.Header>

					<Card.Content className="px-4 pt-0 pb-4">
						<Accordion
							className="w-full"
							hideSeparator
							onClick={(e) => e.stopPropagation()}
						>
							<Accordion.Item id="actions">
								<Accordion.Heading>
									<Accordion.Trigger className="py-1 text-muted-foreground text-xs hover:text-foreground">
										更多資訊與操作
										<Accordion.Indicator />
									</Accordion.Trigger>
								</Accordion.Heading>
								<Accordion.Panel>
									<Accordion.Body className="flex flex-col gap-2 pt-2">
										<div className="flex gap-2">
											{isAuthorized && (
												<>
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
												</>
											)}
										</div>
										<Button
											className="h-8 w-full text-xs"
											onPress={(e) => {
												e.continuePropagation();
												infoState.open();
											}}
											variant="ghost"
										>
											<Info className="mr-1 h-3.5 w-3.5" />
											詳情資訊
										</Button>
									</Accordion.Body>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					</Card.Content>
				</div>
			</Card>

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

			<Modal.Backdrop
				isOpen={infoState.isOpen}
				onOpenChange={infoState.setOpen}
			>
				<Modal.Container>
					<Modal.Dialog className="sm:max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
								<Info className="size-5" />
							</Modal.Icon>
							<Modal.Heading>程序詳情資訊</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="space-y-4 pb-6">
							<div className="grid gap-4 rounded-xl bg-content2 p-4 text-sm">
								<div className="space-y-1">
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
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

								<div className="space-y-1">
									<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										試算表分頁名稱 (Sheet Name)
									</p>
									<p className="font-medium">{process.sheetName}</p>
								</div>

								<div className="grid grid-cols-2 gap-4 border-divider border-t pt-2">
									<div className="space-y-1">
										<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											建立者
										</p>
										<div className="flex items-center gap-1.5">
											<User className="h-3.5 w-3.5 text-muted-foreground" />
											<span>{activity.creator?.name ?? "未知"}</span>
										</div>
									</div>
									<div className="space-y-1">
										<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											建立日期
										</p>
										<div className="flex items-center gap-1.5">
											<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
											<span>
												{new Date(activity.createdAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
							</div>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}
