"use client";

import { Breadcrumbs, Button } from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";

interface ActivityHeaderProps {
	isSyncing: boolean;
	onSync: () => void;
	title?: string;
	modeLabel: string;
}

export function ActivityHeader({
	isSyncing,
	onSync,
	title = "Activity",
	modeLabel,
}: ActivityHeaderProps) {
	return (
		<div className="flex flex-col gap-6">
			<Breadcrumbs>
				<Breadcrumbs.Item>
					<Link className="link hover:underline" href="/">
						Home
					</Link>
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>{modeLabel}</Breadcrumbs.Item>
			</Breadcrumbs>

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{title}</h1>
					<p className="text-muted-foreground">
						Manage and synchronize data from Google Sheets.
					</p>
				</div>
				<div className="flex items-center gap-3">
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
		</div>
	);
}
