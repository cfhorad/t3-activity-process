import { Button, Chip, Modal, Spinner } from "@heroui/react";
import { CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { AreaStatusItem } from "../_hooks/usePendingApproval";

interface ApprovalResultModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	myApplications?: AreaStatusItem[];
	hasApproved: boolean;
	onRedirect: () => void;
}

export function ApprovalResultModal({
	isOpen,
	onOpenChange,
	myApplications,
	hasApproved,
	onRedirect,
}: ApprovalResultModalProps) {
	const [isRedirecting, setIsRedirecting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setIsRedirecting(false);
		}
	}, [isOpen]);
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						{hasApproved ? (
							<Modal.Icon className="bg-success-soft text-success">
								<CheckCircle2 className="size-5" />
							</Modal.Icon>
						) : (
							<Modal.Icon className="animate-pulse bg-warning-soft text-warning">
								<Clock className="size-5" />
							</Modal.Icon>
						)}
						<Modal.Heading>
							{hasApproved ? "權限審核結果：已開通" : "權限審核結果：處理中"}
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 pb-6">
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								以下是您目前的審核結果：
							</p>
							<div className="divide-y divide-separator/20 rounded-2xl border border-border/40 bg-default-50/50 p-2">
								{myApplications && myApplications.length > 0 ? (
									myApplications.map((app) => (
										<div
											className="flex items-center justify-between gap-3 p-3"
											key={app.areaId}
										>
											<div className="min-w-0 flex-1">
												<p className="truncate font-bold text-foreground text-sm">
													{app.area.name}
												</p>
												{app.status === "rejected" && app.rejectedReason && (
													<p className="mt-0.5 text-danger text-xs">
														退回原因: {app.rejectedReason}
													</p>
												)}
											</div>
											<Chip
												className="shrink-0 font-semibold"
												color={
													app.status === "approved"
														? "success"
														: app.status === "rejected"
															? "danger"
															: "warning"
												}
												size="sm"
												variant="soft"
											>
												{app.status === "approved"
													? "已開通"
													: app.status === "rejected"
														? "被退回"
														: "審核中"}
											</Chip>
										</div>
									))
								) : (
									<p className="p-4 text-center text-muted-foreground text-sm italic">
										尚未提交任何申請
									</p>
								)}
							</div>
							{hasApproved && (
								<p className="animate-pulse font-medium text-success text-xs">
									恭喜！您已獲得分會授權，可以點選下方按鈕前往活動管理系統。
								</p>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer>
						{hasApproved ? (
							<Button
								className="flex-1 bg-linear-to-r from-blue-600 to-violet-600 font-bold text-white shadow-md"
								isPending={isRedirecting}
								onPress={() => {
									setIsRedirecting(true);
									onRedirect();
								}}
								variant="primary"
							>
								{isRedirecting && <Spinner color="current" size="sm" />}
								前往活動管理
							</Button>
						) : (
							<Button
								className="flex-1 font-semibold"
								onPress={() => onOpenChange(false)}
								variant="secondary"
							>
								關閉
							</Button>
						)}
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
