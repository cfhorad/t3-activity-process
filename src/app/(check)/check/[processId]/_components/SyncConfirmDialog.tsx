"use client";

import { AlertDialog, Button } from "@heroui/react";
import { RefreshCcw } from "lucide-react";

interface SyncConfirmDialogProps {
	isSyncing: boolean;
	onSync: () => void;
}

export function SyncConfirmDialog({
	isSyncing,
	onSync,
}: SyncConfirmDialogProps) {
	return (
		<AlertDialog>
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
						{isSyncing ? "同步中..." : "從 Google 試算表同步"}
					</div>
				</Button>
			</AlertDialog.Trigger>
			<AlertDialog.Backdrop>
				<AlertDialog.Container>
					<AlertDialog.Dialog aria-labelledby="sync-confirm-heading">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="warning" />
							<AlertDialog.Heading id="sync-confirm-heading">
								確認同步數據
							</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								同步將從 Google 試算表獲取最新數據並替換您的本地報到狀態。
								此操作無法撤銷。
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								取消
							</Button>
							<Button onPress={onSync} slot="close" variant="primary">
								立即同步
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</AlertDialog>
	);
}
