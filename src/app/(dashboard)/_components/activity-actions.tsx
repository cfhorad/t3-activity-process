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

interface Activity {
	id: number;
	name: string;
	googleSheetId: string;
}

export function ActivityActions({
	activity,
	userRole,
}: {
	activity: Activity;
	userRole: string;
}) {
	const editState = useOverlayState();
	const deleteState = useOverlayState();
	const utils = api.useUtils();

	const updateActivity = api.activity.update.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
			editState.close();
		},
	});

	const deleteActivity = api.activity.delete.useMutation({
		onSuccess: () => {
			void utils.activity.getAll.invalidate();
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
		const googleSheetId = formData.get("googleSheetId") as string;

		updateActivity.mutate({
			id: activity.id,
			name,
			googleSheetId,
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
							<Label>Edit Activity</Label>
						</Dropdown.Item>
						<Dropdown.Item
							id="delete"
							onPress={deleteState.open}
							textValue="Delete"
							variant="danger"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							<Label>Delete Activity</Label>
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
							<Modal.Icon className="bg-primary/10 text-primary">
								<Pencil className="h-5 w-5" />
							</Modal.Icon>
							<Modal.Heading>Edit Activity</Modal.Heading>
						</Modal.Header>

						<Form onSubmit={handleEdit}>
							<Modal.Body className="p-6">
								<div className="flex flex-col gap-4">
									<TextField
										defaultValue={activity.name}
										isRequired
										name="name"
									>
										<Label>Activity Name</Label>
										<Input variant="secondary" />
									</TextField>
									<TextField
										defaultValue={activity.googleSheetId}
										isRequired
										name="googleSheetId"
									>
										<Label>Google Spreadsheet ID</Label>
										<Input variant="secondary" />
									</TextField>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button onPress={editState.close} variant="secondary">
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
							<AlertDialog.Heading>Delete Activity?</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Are you sure you want to delete <strong>{activity.name}</strong>
								? This action will also delete all associated processes and
								synced data.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button onPress={deleteState.close} variant="tertiary">
								Cancel
							</Button>
							<Button
								isPending={deleteActivity.isPending}
								onPress={() => deleteActivity.mutate({ id: activity.id })}
								variant="danger"
							>
								{deleteActivity.isPending ? "Deleting..." : "Delete Activity"}
							</Button>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>
		</>
	);
}
