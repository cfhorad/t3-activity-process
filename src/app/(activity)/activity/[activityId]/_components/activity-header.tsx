import { Link } from "@heroui/react";
import { Calendar, ExternalLink, LayoutGrid, User } from "lucide-react";

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
				<div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
					<Link
						className="flex items-center gap-1.5 text-small transition-colors hover:text-primary"
						href={`https://docs.google.com/spreadsheets/d/${activity.googleSheetId}`}
						target="_blank"
					>
						<ExternalLink className="h-4 w-4" />
						Spreadsheet ID: {activity.googleSheetId}
					</Link>
					<div className="flex items-center gap-1.5 text-small">
						<User className="h-4 w-4" />
						Created by {activity.creator?.name ?? "Unknown"}
					</div>
					<div className="flex items-center gap-1.5 text-small">
						<Calendar className="h-4 w-4" />
						Created on {new Date(activity.createdAt).toLocaleDateString()}
					</div>
				</div>
			</div>
		</div>
	);
}
