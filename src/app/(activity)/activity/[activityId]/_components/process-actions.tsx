"use client";

import {
	AlertDialog,
	Button,
	Dropdown,
	Form,
	Input,
	Label,
	Modal,
	TextField,
	useOverlayState,
} from "@heroui/react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";

interface Process {
	id: number;
	name: string;
	sheetName: string;
	activityId: number;
}

export function ProcessActions({
	process,
	userRole,
}: {
	process: Process;
	userRole: string;
}) {
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const utils = api.useUtils();

	const updateProcess = api.process.update.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId: process.activityId,
			});
			editState.close();
		},
	});

	const deleteProcess = api.process.delete.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({
				activityId: process.activityId,
			});
			deleteState.close();
		},
	});

	if (userRole !== "ADMIN" && userRole !== "MANAGER") {
		return null;
	}

	const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const sheetName = formData.get("sheetName") as string;

		updateProcess.mutate({
			id: process.id,
			name,
			sheetName,
		});
	};

	return (
		<>
			<Dropdown>
				<Dropdown.Trigger>
					<Button isIconOnly size="sm" variant="tertiary">
						<EllipsisVertical className="h-4 w-4" />
					</Button>
				</Dropdown.Trigger>
				<Dropdown.Popover>
					<Dropdown.Menu>
						<Dropdown.Item id="edit" onPress={editState.open} textValue="Edit">
							<Pencil className="mr-2 h-4 w-4" />
							<Label>Edit Process</Label>
						</Dropdown.Item>
						<Dropdown.Item
							id="delete"
							onPress={deleteState.open}
							textValue="Delete"
							variant="danger"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							<Label>Delete Process</Label>
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown>

			{/* Edit Modal */}
			<Modal.Backdrop
				isOpen={editState.isOpen}
				onOpenChange={editState.setOpen}
			>
				<Modal.Container>
					<Modal.Dialog className="sm:max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-secondary/10 text-secondary">
								<Pencil className="h-5 w-5" />
							</Modal.Icon>
							<Modal.Heading>Edit Process</Modal.Heading>
						</Modal.Header>

						<Form onSubmit={handleEdit}>
							<Modal.Body className="p-6">
								<div className="flex flex-col gap-4">
									<TextField defaultValue={process.name} isRequired name="name">
										<Label>Process Name</Label>
										<Input variant="secondary" />
									</TextField>
									<TextField
										defaultValue={process.sheetName}
										isRequired
										name="sheetName"
									>
										<Label>Google Sheet Tab Name</Label>
										<Input variant="secondary" />
									</TextField>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button onPress={editState.close} variant="secondary">
									Cancel
								</Button>
								<Button isPending={updateProcess.isPending} type="submit">
									{updateProcess.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>

			{/* Delete Alert Dialog */}
			<AlertDialog.Backdrop
				isOpen={deleteState.isOpen}
				onOpenChange={deleteState.setOpen}
			>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-[400px]">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>Delete Process?</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Are you sure you want to delete <strong>{process.name}</strong>?
								This action will also delete all synced data for this process.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button onPress={deleteState.close} variant="tertiary">
								Cancel
							</Button>
							<Button
								isPending={deleteProcess.isPending}
								onPress={() => deleteProcess.mutate({ id: process.id })}
								variant="danger"
							>
								{deleteProcess.isPending ? "Deleting..." : "Delete Process"}
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</>
	);
}
