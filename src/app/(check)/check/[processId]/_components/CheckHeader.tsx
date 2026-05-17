"use client";

import { PageHeader } from "~/app/_components/page-header";
import { SyncConfirmDialog } from "~/app/_components/sync-confirm-dialog";
import type { User } from "~/server/better-auth/config";
import { api } from "~/trpc/react";

interface CheckHeaderProps {
	processId: number;
	isSyncing: boolean;
	onSync: () => void;
	user: User;
}

export function CheckHeader({
	processId,
	isSyncing,
	onSync,
	user,
}: CheckHeaderProps) {
	const { data: process } = api.process.getById.useQuery({ id: processId });

	const role = user?.role?.toUpperCase();
	const userId = user?.id;
	const userAreaId = user?.areaId;

	const isCreator = process?.activity?.createdById === userId;
	const isAreaAdmin =
		role === "ADMIN" &&
		(userAreaId === "ALL" || process?.activity?.areaId === userAreaId);

	const isAuthorized = isCreator || isAreaAdmin;

	return (
		<PageHeader
			action={
				isAuthorized ? (
					<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />
				) : undefined
			}
			backHref={process ? `/activity/${process.activityId}` : "/"}
			backLabel={process?.activity?.name ?? "返回活動"}
			title={process?.name ?? "報到清單"}
		/>
	);
}
