"use client";

import {
	Button,
	Form,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	TextField,
	useOverlayState,
} from "@heroui/react";
import { Plus, Sheet, TableProperties } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";

export function CreateProcessButton({
	activityId,
	userRole,
	variant = "secondary",
	size = "md",
	className,
}: {
	activityId: number;
	userRole: string;
	variant?:
		| "primary"
		| "secondary"
		| "tertiary"
		| "danger"
		| "danger-soft"
		| "ghost"
		| "outline";
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	const state = useOverlayState();
	const utils = api.useUtils();
	const [selectedSheet, setSelectedSheet] = useState<string>("");

	const isAuthorized =
		userRole?.toUpperCase() === "ADMIN" ||
		userRole?.toUpperCase() === "MANAGER";
	const { data: activity } = api.activity.getById.useQuery(
		{ id: activityId },
		{ enabled: isAuthorized },
	);
	const { data: sheetNames, isLoading: isLoadingSheets } =
		api.googleSheet.getSheetMetadata.useQuery(
			{ spreadsheetId: activity?.googleSheetId ?? "" },
			{ enabled: isAuthorized && !!activity?.googleSheetId },
		);

	const createProcess = api.process.create.useMutation({
		onSuccess: () => {
			void utils.process.getByActivityId.invalidate({ activityId });
			state.close();
			setSelectedSheet("");
		},
	});

	const normalizedRole = userRole?.toUpperCase();
	if (normalizedRole !== "ADMIN" && normalizedRole !== "MANAGER") {
		return null;
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const sheetName = selectedSheet;

		createProcess.mutate({ name, activityId, sheetName });
	};

	return (
		<>
			<Button
				className={className}
				onPress={state.open}
				size={size}
				variant={variant}
			>
				<Plus className="h-5 w-5" />
				New Process
			</Button>

			<Modal.Backdrop
				isOpen={state.isOpen}
				onOpenChange={(open) => {
					state.setOpen(open);
					if (!open) setSelectedSheet("");
				}}
			>
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

									<Select
										isRequired
										onChange={(val) => {
											setSelectedSheet(val as string);
										}}
										placeholder={
											isLoadingSheets ? "Loading sheets..." : "Select a sheet"
										}
										value={selectedSheet}
										variant="secondary"
									>
										<Label>Google Sheet Tab Name</Label>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{(sheetNames ?? []).map((name) => (
													<ListBox.Item id={name} key={name} textValue={name}>
														<Sheet className="mr-2 h-4 w-4 text-muted-foreground" />
														{name}
														<ListBox.ItemIndicator />
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button onPress={state.close} variant="secondary">
									Cancel
								</Button>
								<Button
									isDisabled={!selectedSheet}
									isPending={createProcess.isPending}
									type="submit"
								>
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
