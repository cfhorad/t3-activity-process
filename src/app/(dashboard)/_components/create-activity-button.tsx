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
import { api } from "~/trpc/react";

export function CreateActivityButton({ userRole }: { userRole: string }) {
	const state = useOverlayState();
	const router = useRouter();
	const utils = api.useUtils();

	const createActivity = api.activity.create.useMutation({
		onSuccess: (data) => {
			if (!data) return;
			void utils.activity.getAll.invalidate();
			state.close();
			router.push(`/activity/${data.id}`);
		},
	});

	if (userRole !== "ADMIN" && userRole !== "MANAGER") {
		return null;
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const googleSheetId = formData.get("googleSheetId") as string;

		createActivity.mutate({ name, googleSheetId });
	};

	return (
		<>
			<Button className="font-bold" onPress={state.open} variant="primary">
				<Plus className="h-5 w-5" />
				New Activity
			</Button>

			<Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
				<Modal.Container>
					<Modal.Dialog className="sm:max-w-md">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-primary/10 text-primary">
								<LayoutGrid className="h-5 w-5" />
							</Modal.Icon>
							<Modal.Heading>Create Activity</Modal.Heading>
							<p className="mt-1.5 text-muted-foreground text-sm">
								Add a new activity by connecting a Google Spreadsheet ID.
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
										<Label>Google Spreadsheet ID</Label>
										<Input
											placeholder="Enter the spreadsheet ID"
											variant="secondary"
										/>
									</TextField>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button onPress={state.close} variant="secondary">
									Cancel
								</Button>
								<Button isPending={createActivity.isPending} type="submit">
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
