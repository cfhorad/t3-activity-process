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
			<Breadcrumbs aria-label="Breadcrumb navigation">
				<Breadcrumbs.Item>
					<Link className="link hover:underline" href="/">
						Dashboard
					</Link>
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>
					{process ? (
						<Link
							className="link hover:underline"
							href={`/activity/${process.activityId}`}
						>
							{process.activity?.name ?? "Activity"}
						</Link>
					) : (
						"Activity"
					)}
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>{process?.name ?? "Check-in List"}</Breadcrumbs.Item>
			</Breadcrumbs>

			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						{process?.name ?? "Check-in List"}
					</h1>
					<p className="text-muted-foreground">
						{process
							? `Sheet: ${process.sheetName} (Check-in Mode)`
							: "Synchronize attendees and track check-ins."}
					</p>
				</div>

				<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />
			</div>
		</div>
	);
}
