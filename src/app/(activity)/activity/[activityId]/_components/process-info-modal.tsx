"use client";

import { Modal } from "@heroui/react";
import { Calendar, ExternalLink, Info, User } from "lucide-react";
import Link from "next/link";
import type { Activity, Process } from "~/server/db/schema";

interface ProcessInfoModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	process: Pick<Process, "sheetName">;
	activity: Activity & {
		creator?: { name: string | null } | null;
	};
}

export function ProcessInfoModal({
	isOpen,
	onOpenChange,
	process,
	activity,
}: ProcessInfoModalProps) {
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
						<div className="grid gap-4 rounded-xl bg-content2 p-4 text-sm">
							<div className="space-y-1">
								<p className="font-semibold text-muted-foreground text-xs">
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
								<p className="font-semibold text-muted-foreground text-xs">
									試算表分頁名稱 (Sheet Name)
								</p>
								<p className="font-medium text-danger">{process.sheetName}</p>
							</div>

							<div className="grid grid-cols-2 gap-4 border-divider border-t pt-2">
								<div className="space-y-1">
									<p className="font-semibold text-muted-foreground text-xs">
										建立者
									</p>
									<div className="flex items-center gap-1.5">
										<User className="h-3.5 w-3.5 text-muted-foreground" />
										<span>{activity.creator?.name ?? "未知"}</span>
									</div>
								</div>
								<div className="space-y-1">
									<p className="font-semibold text-muted-foreground text-xs">
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
	);
}
