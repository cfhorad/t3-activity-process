"use client";

import { AlertDialog, Button, Spinner } from "@heroui/react";
import type { ReactNode } from "react";

interface ConfirmDeleteDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string;
	description: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	isPending?: boolean;
	variant?: "danger" | "danger-soft" | "primary" | "secondary";
}

export function ConfirmDeleteDialog({
	isOpen,
	onOpenChange,
	title,
	description,
	confirmLabel = "Delete",
	cancelLabel = "Cancel",
	onConfirm,
	isPending = false,
	variant = "danger-soft",
}: ConfirmDeleteDialogProps) {
	return (
		<AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<AlertDialog.Container>
				<AlertDialog.Dialog className="sm:max-w-[400px]">
					<AlertDialog.CloseTrigger />
					<AlertDialog.Header>
						<AlertDialog.Icon
							status={
								variant === "danger" || variant === "danger-soft"
									? "danger"
									: undefined
							}
						/>
						<AlertDialog.Heading>{title}</AlertDialog.Heading>
					</AlertDialog.Header>
					<AlertDialog.Body>{description}</AlertDialog.Body>
					<AlertDialog.Footer>
						<Button onPress={() => onOpenChange(false)} variant="tertiary">
							{cancelLabel}
						</Button>
						<Button isPending={isPending} onPress={onConfirm} variant={variant}>
							{isPending && <Spinner color="current" size="sm" />}
							{isPending ? `${confirmLabel}...` : confirmLabel}
						</Button>
					</AlertDialog.Footer>
				</AlertDialog.Dialog>
			</AlertDialog.Container>
		</AlertDialog.Backdrop>
	);
}
