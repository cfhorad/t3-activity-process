"use client";

import { buttonVariants, Card, Spinner } from "@heroui/react";
import { Calendar, LayoutGrid, User } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

import { ActivityActions } from "./activity-actions";

export function ActivityList({ userRole }: { userRole: string }) {
	const { data: activities, isLoading } = api.activity.getAll.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner size="lg" />
					<span className="text-muted-foreground text-small">
						Loading activities...
					</span>
				</div>
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-12 text-center">
				<LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-bold text-xl">No activities found</h3>
				<p className="text-muted-foreground">
					Create your first activity to get started.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{activities.map((activity) => (
				<Card
					className="bg-content1 transition-colors hover:bg-content2"
					key={activity.id}
				>
					<Card.Header className="flex gap-3 px-6 pt-6 pb-2">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<LayoutGrid className="h-6 w-6" />
						</div>
						<div className="flex flex-1 items-center justify-between">
							<div className="flex flex-col">
								<Card.Title className="font-bold text-md">
									{activity.name}
								</Card.Title>
								<Card.Description className="text-muted-foreground text-small">
									ID: {activity.googleSheetId}
								</Card.Description>
							</div>
							<ActivityActions activity={activity} userRole={userRole} />
						</div>
					</Card.Header>
					<Card.Content className="px-6 py-4">
						<div className="flex items-center gap-2 text-muted-foreground text-small">
							<User className="h-4 w-4" />
							<span>Created by: {activity.creator?.name ?? "Unknown"}</span>
						</div>
						<div className="mt-2 flex items-center gap-2 text-muted-foreground text-small">
							<Calendar className="h-4 w-4" />
							<span>{new Date(activity.createdAt).toLocaleDateString()}</span>
						</div>
					</Card.Content>
					<Card.Footer className="px-6 pt-2 pb-6">
						<Link
							className={buttonVariants({
								variant: "secondary",
								size: "sm",
								fullWidth: true,
							})}
							href={`/activity/${activity.id}`}
						>
							View Processes
						</Link>
					</Card.Footer>
				</Card>
			))}
		</div>
	);
}
