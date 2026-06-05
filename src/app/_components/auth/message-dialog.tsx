"use client";

import { AlertDialog, Button } from "@heroui/react";

export type MessageDialogStatus =
	| "default"
	| "accent"
	| "success"
	| "warning"
	| "danger";

interface MessageDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string;
	message: string;
	status?: MessageDialogStatus;
	confirmText?: string;
}

export function MessageDialog({
	isOpen,
	onOpenChange,
	title,
	message,
	status = "default",
	confirmText = "確定",
}: MessageDialogProps) {
	return (
		<AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
			<AlertDialog.Backdrop
				isDismissable={true}
				isKeyboardDismissDisabled={false}
			>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-[400px]">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status={status} />
							<AlertDialog.Heading>{title}</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p className="text-muted-foreground">{message}</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button
								className="w-full"
								slot="close"
								variant={status === "danger" ? "danger" : "primary"}
							>
								{confirmText}
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</AlertDialog>
	);
}
