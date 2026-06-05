"use client";

import { AlertDialog, Button, Tooltip } from "@heroui/react";
import { RefreshCcw } from "lucide-react";

interface SyncConfirmDialogProps {
	isSyncing: boolean;
	onSync: () => void;
	title?: string;
	description?: string;
	triggerLabel?: string;
	triggerPendingLabel?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

export function SyncConfirmDialog({
	isSyncing,
	onSync,
	title = "確認同步數據",
	description = "同步將從 Google 試算表獲取最新數據並替換您的本地數據。此操作無法撤銷。",
	triggerLabel = "試算表同步",
	triggerPendingLabel = "同步中...",
	confirmLabel = "立即同步",
	cancelLabel = "取消",
}: SyncConfirmDialogProps) {
	return (
		<AlertDialog>
			<Tooltip closeDelay={0} delay={0}>
				<Tooltip.Trigger>
					<AlertDialog.Trigger>
						<Button
							className="font-medium shadow-sm"
							isPending={isSyncing}
							variant="primary"
						>
							<div className="flex items-center gap-2">
								<RefreshCcw
									className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
								/>
								{isSyncing ? triggerPendingLabel : triggerLabel}
							</div>
						</Button>
					</AlertDialog.Trigger>
				</Tooltip.Trigger>
				<Tooltip.Content placement="top">{description}</Tooltip.Content>
			</Tooltip>
			<AlertDialog.Backdrop>
				<AlertDialog.Container>
					<AlertDialog.Dialog aria-labelledby="sync-confirm-heading">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="warning" />
							<AlertDialog.Heading id="sync-confirm-heading">
								{title}
							</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>{description}</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								{cancelLabel}
							</Button>
							<Button onPress={onSync} slot="close" variant="primary">
								{confirmLabel}
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</AlertDialog>
	);
}
