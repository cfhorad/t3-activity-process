"use client";

import { Button, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ActivityFormModal } from "./activity-form-modal";

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

	const normalizedRole = userRole?.toUpperCase();
	if (normalizedRole !== "ADMIN" && normalizedRole !== "MANAGER") {
		return null;
	}

	return (
		<>
			<Button className="font-bold" onPress={state.open} variant="primary">
				<Plus className="h-5 w-5" />
				New Activity
			</Button>

			<ActivityFormModal
				description="Add a new activity by connecting a Google Spreadsheet."
				isOpen={state.isOpen}
				isPending={createActivity.isPending}
				mode="create"
				onClose={state.close}
				onOpenChange={state.setOpen}
				onSubmit={(data) => createActivity.mutate(data)}
				submitLabel="Create Activity"
				title="Create Activity"
			/>
		</>
	);
}
