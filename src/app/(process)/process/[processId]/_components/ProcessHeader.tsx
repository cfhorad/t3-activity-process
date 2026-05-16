"use client";

import { PageHeader } from "~/app/_components/page-header";
import { SyncConfirmDialog } from "~/app/_components/sync-confirm-dialog";
import { api } from "~/trpc/react";

interface ProcessHeaderProps {
	processId: number;
	isSyncing: boolean;
	onSync: () => void;
}

export function ProcessHeader({
	processId,
	isSyncing,
	onSync,
}: ProcessHeaderProps) {
	const { data: process } = api.process.getById.useQuery({ id: processId });

	return (
		<PageHeader
			action={<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />}
			breadcrumbs={[
				{ label: "儀表板", href: "/" },
				{
					label: process?.activity?.name ?? "活動",
					href: process ? `/activity/${process.activityId}` : undefined,
				},
				{ label: process?.name ?? "處理流程" },
			]}
			title={process?.name ?? "數據處理"}
		/>
	);
}
