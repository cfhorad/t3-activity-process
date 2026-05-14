"use client";

import { LayoutGrid } from "lucide-react";

interface ActivityHeaderProps {
	activity: {
		id: number;
		name: string;
		googleSheetId: string;
		createdAt: Date;
		creator?: {
			name: string | null;
		} | null;
	};
}

export function ActivityHeader({ activity }: ActivityHeaderProps) {
	return (
		<div className="flex items-start gap-4">
			<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<LayoutGrid className="h-8 w-8" />
			</div>
			<div>
				<h1 className="font-bold text-3xl tracking-tight md:text-4xl">
					{activity.name}
				</h1>
			</div>
		</div>
	);
}
