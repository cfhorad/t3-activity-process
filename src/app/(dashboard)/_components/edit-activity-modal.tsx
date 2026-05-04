"use client";

import { Button, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { extractSpreadsheetId } from "~/utils/google-sheet-parser";

interface EditActivityModalProps {
	activity: {
		id: number;
		name: string;
		googleSheetId: string;
	};
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onClose: () => void;
}

export function EditActivityModal({
	activity,
	isOpen,
	onOpenChange,
	onClose,
}: EditActivityModalProps) {
	const utils = api.useUtils();
	const [spreadsheetInput, setSpreadsheetInput] = useState(
		activity.googleSheetId,
	);
	const [nameInput, setNameInput] = useState(activity.name);

	const updateActivity = api.activity.update.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
			onClose();
		},
	});

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setSpreadsheetInput(activity.googleSheetId);
			setNameInput(activity.name);
		}
	}, [isOpen, activity]);

	const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const googleSheetId =
			extractSpreadsheetId(spreadsheetInput) ?? spreadsheetInput;

		updateActivity.mutate({
			id: activity.id,
			name: nameInput,
			googleSheetId,
		});
	};

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-primary/10 text-primary">
							<Pencil className="h-5 w-5" />
						</Modal.Icon>
						<Modal.Heading>Edit Activity</Modal.Heading>
					</Modal.Header>

					<Form onSubmit={handleEdit}>
						<Modal.Body className="p-6">
							<div className="flex flex-col gap-4">
								<TextField isRequired name="name">
									<Label>Activity Name</Label>
									<Input
										onChange={(e) => setNameInput(e.target.value)}
										value={nameInput}
										variant="secondary"
									/>
								</TextField>

								<TextField isRequired name="googleSheetId">
									<Label>Google Spreadsheet URL or ID</Label>
									<Input
										onChange={(e) => setSpreadsheetInput(e.target.value)}
										value={spreadsheetInput}
										variant="secondary"
									/>
								</TextField>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button onPress={onClose} variant="secondary">
								Cancel
							</Button>
							<Button isPending={updateActivity.isPending} type="submit">
								{updateActivity.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
