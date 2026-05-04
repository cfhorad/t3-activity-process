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
import { LayoutGrid, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { extractSpreadsheetId } from "~/utils/google-sheet-parser";

export function CreateActivityButton({ userRole }: { userRole: string }) {
	const state = useOverlayState();
	const router = useRouter();
	const utils = api.useUtils();

	const [spreadsheetInput, setSpreadsheetInput] = useState("");
	const [spreadsheetId, setSpreadsheetId] = useState("");

	const createActivity = api.activity.create.useMutation({
		onSuccess: (data) => {
			if (!data) return;
			void utils.activity.getAll.invalidate();
			state.close();
			router.push(`/activity/${data.id}`);
		},
	});

	// Extract ID when input changes
	useEffect(() => {
		const id = extractSpreadsheetId(spreadsheetInput);
		if (id) {
			setSpreadsheetId(id);
		} else {
			setSpreadsheetId("");
		}
	}, [spreadsheetInput]);

	const normalizedRole = userRole?.toUpperCase();
	if (normalizedRole !== "ADMIN" && normalizedRole !== "MANAGER") {
		return null;
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const googleSheetId = spreadsheetId;

		createActivity.mutate({ name, googleSheetId });
	};

	return (
		<>
			<Button className="font-bold" onPress={state.open} variant="primary">
				<Plus className="h-5 w-5" />
				New Activity
			</Button>

			<Modal.Backdrop
				isOpen={state.isOpen}
				onOpenChange={(open) => {
					state.setOpen(open);
					if (!open) {
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
								<LayoutGrid className="h-5 w-5" />
							</Modal.Icon>
							<Modal.Heading>Create Activity</Modal.Heading>
							<p className="mt-1.5 text-muted-foreground text-sm">
								Add a new activity by connecting a Google Spreadsheet.
							</p>
						</Modal.Header>

						<Form onSubmit={handleSubmit}>
							<Modal.Body className="p-6">
								<div className="flex flex-col gap-4">
									<TextField isRequired name="name">
										<Label>Activity Name</Label>
										<Input
											placeholder="e.g. Dining Registration"
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
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button onPress={state.close} variant="secondary">
									Cancel
								</Button>
								<Button
									isDisabled={!spreadsheetId}
									isPending={createActivity.isPending}
									type="submit"
								>
									{createActivity.isPending ? "Creating..." : "Create Activity"}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}
