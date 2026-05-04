"use client";

import { Button, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { extractSpreadsheetId } from "~/utils/google-sheet-parser";

interface ActivityFormData {
	name: string;
	googleSheetId: string;
	activityDate: string;
	activityMemo?: string | null;
}

interface ActivityFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: ActivityFormData) => void;
	isPending: boolean;
	initialData?: {
		name: string;
		googleSheetId: string;
		activityDate: string;
		activityMemo?: string | null;
	};
	title: string;
	description?: string;
	submitLabel: string;
	mode: "create" | "edit";
}

export function ActivityFormModal({
	isOpen,
	onClose,
	onOpenChange,
	onSubmit,
	isPending,
	initialData,
	title,
	description,
	submitLabel,
	mode,
}: ActivityFormModalProps) {
	const [spreadsheetInput, setSpreadsheetInput] = useState(
		initialData?.googleSheetId ?? "",
	);
	const [spreadsheetId, setSpreadsheetId] = useState(
		initialData?.googleSheetId ?? "",
	);

	// Extract ID when input changes
	useEffect(() => {
		const id = extractSpreadsheetId(spreadsheetInput);
		if (id) {
			setSpreadsheetId(id);
		} else if (spreadsheetInput.length > 0) {
			// If it's not a URL, assume it might be a direct ID
			setSpreadsheetId(spreadsheetInput);
		} else {
			setSpreadsheetId("");
		}
	}, [spreadsheetInput]);

	// Reset state when initialData changes or modal opens
	useEffect(() => {
		if (isOpen) {
			setSpreadsheetInput(initialData?.googleSheetId ?? "");
			setSpreadsheetId(initialData?.googleSheetId ?? "");
		}
	}, [initialData, isOpen]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const activityDate = formData.get("activityDate") as string;
		const activityMemo = formData.get("activityMemo") as string;
		const googleSheetId = spreadsheetId;

		onSubmit({ name, googleSheetId, activityDate, activityMemo });
	};

	return (
		<Modal.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open && mode === "create") {
					setSpreadsheetInput("");
					setSpreadsheetId("");
				}
			}}
		>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-primary/10 text-primary">
							{mode === "create" ? (
								<Plus className="h-5 w-5" />
							) : (
								<Pencil className="h-5 w-5" />
							)}
						</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
						{description && (
							<p className="mt-1.5 text-muted-foreground text-sm">
								{description}
							</p>
						)}
					</Modal.Header>

					<Form onSubmit={handleSubmit}>
						<Modal.Body className="p-6">
							<div className="flex flex-col gap-4">
								<TextField
									defaultValue={initialData?.name ?? ""}
									isRequired
									name="name"
								>
									<Label>Activity Name</Label>
									<Input
										placeholder={
											mode === "create" ? "e.g. Dining Registration" : undefined
										}
										variant="secondary"
									/>
								</TextField>

								<TextField isRequired name="googleSheetId">
									<Label>Google Spreadsheet URL or ID</Label>
									<Input
										onChange={(e) => setSpreadsheetInput(e.target.value)}
										placeholder="Paste spreadsheet URL here"
										value={spreadsheetInput}
										variant="secondary"
									/>
								</TextField>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<TextField
										defaultValue={initialData?.activityDate ?? ""}
										isRequired
										name="activityDate"
									>
										<Label>Activity Date</Label>
										<Input type="date" variant="secondary" />
									</TextField>

									<TextField
										defaultValue={initialData?.activityMemo ?? ""}
										name="activityMemo"
									>
										<Label>Memo</Label>
										<Input
											placeholder={
												mode === "create" ? "e.g. Annual dinner" : undefined
											}
											variant="secondary"
										/>
									</TextField>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button onPress={onClose} variant="secondary">
								Cancel
							</Button>
							<Button
								isDisabled={!spreadsheetId}
								isPending={isPending}
								type="submit"
							>
								{isPending ? `${submitLabel}...` : submitLabel}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
