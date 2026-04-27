"use client";

import { Breadcrumbs } from "@heroui/react";
import Link from "next/link";

interface ActivityHeaderProps {
	title?: string;
	modeLabel: string;
}

export function ActivityHeader({
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
			</div>
		</div>
	);
}
