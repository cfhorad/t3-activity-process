"use client";

import { Button, Tooltip, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActivityFormModal } from "~/app/_components/activity-form-modal";
import { useAuth } from "~/app/_hooks/useAuth";
import { api } from "~/trpc/react";

export function CreateActivityButton() {
	const state = useOverlayState();
	const router = useRouter();
	const utils = api.useUtils();
	const { isManagerOrAdmin } = useAuth();

	const createActivity = api.activity.create.useMutation({
		onSuccess: (data) => {
			if (!data) return;
			void utils.activity.getAll.invalidate();
			state.close();
			router.push(`/activity/${data.id}`);
		},
	});

	if (!isManagerOrAdmin) {
		return null;
	}

	return (
		<>
			<Tooltip closeDelay={0} delay={0}>
				<Tooltip.Trigger>
					<Button
						aria-label="建立新活動"
						className="rounded-full"
						isIconOnly
						onPress={state.open}
						variant="primary"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</Tooltip.Trigger>
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
