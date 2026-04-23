"use client";

import { Button, Card } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { api } from "~/trpc/react";

type Activity = {
	id: string;
	name: string;
	date: string;
	memo: string | null;
	googleSheetId: string | null;
	googleSheetName: string | null;
	handlingMode: string | null;
};

interface ActivityCardProps {
	activity: Activity;
	onEdit: () => void;
	onDelete: () => void;
	onNavigate: () => void;
}

export function ActivityCard({
	activity,
	onEdit,
	onDelete,
	onNavigate,
}: ActivityCardProps) {
	const utils = api.useUtils();
	const syncMutation = api.googleSheet.sync.useMutation({
		onSuccess: () => {
			void utils.googleSheet.getAll.invalidate({ activityId: activity.id });
			void utils.googleSheet.getColumns.invalidate({ activityId: activity.id });
		},
	});

	const handleSync = () => {
		syncMutation.mutate({ activityId: activity.id });
	};

	return (
		<Card className="group relative w-full overflow-hidden border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/10">
			<Card.Header
				className="cursor-pointer space-y-1 pb-2"
				onClick={onNavigate}
			>
				<Card.Title className="font-bold text-white text-xl tracking-tight group-hover:text-accent">
					{activity.name}
				</Card.Title>
				<Card.Description className="text-white/60">
					{activity.date}
				</Card.Description>
			</Card.Header>
			<Card.Content className="cursor-pointer pb-4" onClick={onNavigate}>
				<p className="line-clamp-2 min-h-10 text-sm text-white/80 leading-relaxed">
					{activity.memo || "No memo available for this activity."}
				</p>
				<div className="mt-4 flex items-center gap-2">
					<div className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-[10px] text-white/60 uppercase tracking-wider">
						{activity.handlingMode}
					</div>
					{activity.googleSheetName && (
						<div className="rounded-full bg-accent-soft-hover px-2 py-0.5 font-bold text-[10px] text-accent uppercase tracking-wider">
							{activity.googleSheetName}
						</div>
					)}
				</div>
			</Card.Content>
			<Card.Footer className="flex items-center justify-between border-white/5 border-t bg-black/20 p-3">
				<Button
					isPending={syncMutation.isPending}
					onPress={handleSync}
					size="sm"
					variant="secondary"
				>
					<RefreshCw
						className={`mr-2 h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
					/>
					Sync
				</Button>
				<div className="flex gap-2">
					<Button onPress={onEdit} size="sm" variant="secondary">
						Edit
					</Button>
					<Button
						className="bg-danger-soft-hover text-danger hover:bg-danger/30"
						onPress={() => {
							onDelete();
						}}
						size="sm"
						variant="secondary"
					>
						Delete
					</Button>
				</div>
			</Card.Footer>
		</Card>
	);
}
