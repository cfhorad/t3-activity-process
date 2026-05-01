"use client";

import { Breadcrumbs, Button } from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
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
		<div className="flex flex-col gap-4">
			<Breadcrumbs>
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
				<Breadcrumbs.Item>{process?.name ?? "Process"}</Breadcrumbs.Item>
			</Breadcrumbs>

			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						{process?.name ?? "Data Processing"}
					</h1>
					<p className="text-muted-foreground">
						{process
							? `Syncing from sheet: ${process.sheetName}`
							: "Manage and synchronize data from Google Sheets."}
					</p>
				</div>
				<Button
					className="font-medium shadow-sm"
					isPending={isSyncing}
					onPress={onSync}
					variant="primary"
				>
					{({ isPending }) => (
						<div className="flex items-center gap-2">
							<RefreshCcw
								className={`size-4 ${isPending ? "animate-spin" : ""}`}
							/>
							{isPending ? "Syncing..." : "Sync from Google Sheet"}
						</div>
					)}
				</Button>
			</div>
		</div>
	);
}
