"use client";

import { Breadcrumbs, Button } from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";

interface ProcessHeaderProps {
	isSyncing: boolean;
	onSync: () => void;
}

export function ProcessHeader({ isSyncing, onSync }: ProcessHeaderProps) {
	return (
		<>
			<Breadcrumbs>
				<Breadcrumbs.Item>
					<Link className="link hover:underline" href="/">
						Home
					</Link>
				</Breadcrumbs.Item>
				<Breadcrumbs.Item>Process</Breadcrumbs.Item>
			</Breadcrumbs>

			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Data Processing</h1>
					<p className="text-muted-foreground">
						Manage and synchronize data from Google Sheets.
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
		</>
	);
}
