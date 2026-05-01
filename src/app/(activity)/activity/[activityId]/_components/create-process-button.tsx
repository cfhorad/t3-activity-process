"use client";

import {
	Button,
	Form,
	Input,
	Label,
	Modal,
	TextField,
	useOverlayState,
} from "@heroui/react";
import { Plus, TableProperties } from "lucide-react";
import { api } from "~/trpc/react";

export function CreateProcessButton({
	activityId,
	userRole,
}: {
	activityId: number;
	userRole: string;
}) {
	const state = useOverlayState();
	const utils = api.useUtils();

	const createProcess = api.process.create.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({ activityId });
			state.close();
		},
	});

	if (userRole !== "ADMIN" && userRole !== "MANAGER") {
		return null;
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const sheetName = formData.get("sheetName") as string;

		createProcess.mutate({ name, activityId, sheetName });
	};

	return (
		<>
			<Button className="font-bold" onPress={state.open} variant="secondary">
				<Plus className="h-5 w-5" />
				New Process
			</Button>

			<Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
				<Modal.Container>
					<Modal.Dialog className="sm:max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-secondary/10 text-secondary">
								<TableProperties className="h-5 w-5" />
							</Modal.Icon>
							<Modal.Heading>Create Process</Modal.Heading>
							<p className="mt-1.5 text-muted-foreground text-sm">
								Add a new sheet (tab) from the spreadsheet to track.
							</p>
						</Modal.Header>

						<Form onSubmit={handleSubmit}>
							<Modal.Body className="p-6">
								<div className="flex flex-col gap-4">
									<TextField isRequired name="name">
										<Label>Process Name</Label>
										<Input placeholder="e.g. Master List" variant="secondary" />
									</TextField>
									<TextField isRequired name="sheetName">
										<Label>Google Sheet Tab Name</Label>
										<Input placeholder="e.g. Sheet1" variant="secondary" />
									</TextField>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button onPress={state.close} variant="secondary">
									Cancel
								</Button>
								<Button isPending={createProcess.isPending} type="submit">
									{createProcess.isPending ? "Creating..." : "Create Process"}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}
