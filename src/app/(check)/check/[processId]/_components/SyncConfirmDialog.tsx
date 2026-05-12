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
						{isSyncing ? "Syncing..." : "Sync from Google Sheet"}
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
								Confirm Data Sync
							</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Syncing will fetch fresh data from Google Sheets and replace
								your local check-in states. This action cannot be undone.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary">
								Cancel
							</Button>
							<Button onPress={onSync} slot="close" variant="primary">
								Sync Now
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</AlertDialog>
	);
}
