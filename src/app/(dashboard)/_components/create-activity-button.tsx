"use client";

import { Button, Tooltip, useOverlayState } from "@heroui/react";
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
			<Tooltip delay={0}>
				<Button
					aria-label="建立新活動"
					className="rounded-full"
					isIconOnly
					onPress={state.open}
					variant="primary"
				>
					<Plus className="h-5 w-5" />
				</Button>
				<Tooltip.Content placement="bottom">建立新活動</Tooltip.Content>
			</Tooltip>

			<ActivityFormModal
				description="透過連接 Google 試算表來新增活動。"
				isOpen={state.isOpen}
				isPending={createActivity.isPending}
				mode="create"
				onClose={state.close}
				onOpenChange={state.setOpen}
				onSubmit={(data) => createActivity.mutate(data)}
				submitLabel="建立活動"
				title="建立活動"
			/>
		</>
	);
}
