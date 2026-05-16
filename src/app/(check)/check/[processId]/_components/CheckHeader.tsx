"use client";

import { PageHeader } from "~/app/_components/page-header";
import { SyncConfirmDialog } from "~/app/_components/sync-confirm-dialog";
import { api } from "~/trpc/react";

interface CheckHeaderProps {
	processId: number;
	isSyncing: boolean;
	onSync: () => void;
}

export function CheckHeader({
	processId,
	isSyncing,
	onSync,
}: CheckHeaderProps) {
	const { data: process } = api.process.getById.useQuery({ id: processId });

	return (
		<PageHeader
			action={<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />}
			backHref={process ? `/activity/${process.activityId}` : "/"}
			backLabel={process?.activity?.name ?? "返回活動"}
			title={process?.name ?? "報到清單"}
		/>
	);
}
