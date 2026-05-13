"use client";

import { Breadcrumbs } from "@heroui/react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { SyncConfirmDialog } from "./SyncConfirmDialog";

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
		<div className="flex flex-col gap-4">
			<Breadcrumbs aria-label="麵包屑導覽">
				<Breadcrumbs.Item>
					<Link className="link hover:underline" href="/">
						儀表板
					</Link>
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>
					{process ? (
						<Link
							className="link hover:underline"
							href={`/activity/${process.activityId}`}
						>
							{process.activity?.name ?? "活動"}
						</Link>
					) : (
						"活動"
					)}
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>{process?.name ?? "報到清單"}</Breadcrumbs.Item>
			</Breadcrumbs>

			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						{process?.name ?? "報到清單"}
					</h1>
					<p className="text-muted-foreground">
						{process
							? `工作表：${process.sheetName} (報到模式)`
							: "同步參與者並追蹤報到狀態。"}
					</p>
				</div>

				<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />
			</div>
		</div>
	);
}
