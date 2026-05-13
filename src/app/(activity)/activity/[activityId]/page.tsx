import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { ActivityHeader } from "./_components/activity-header";
import { CreateProcessButton } from "./_components/create-process-button";
import { ProcessList } from "./_components/process-list";

export default async function ActivityPage({
	params,
}: {
	params: Promise<{ activityId: string }>;
}) {
	const { activityId } = await params;
	const id = parseInt(activityId, 10);
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	if (Number.isNaN(id)) {
		notFound();
	}

	const activity = await api.activity.getById({ id });

	if (!activity) {
		notFound();
	}

	await api.process.getByActivityId.prefetch({ activityId: id });

	return (
		<HydrateClient>
			<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					<div className="mb-6">
						<Link
							className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
							href="/"
						>
							<ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
							Back to Dashboard
						</Link>
					</div>

					<div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
						<ActivityHeader activity={activity} />
						{session && (
							<CreateProcessButton
								activityId={activity.id}
								userRole={session.user.role as string}
							/>
						)}
					</div>

					<div className="space-y-6">
						<h2 className="font-bold text-2xl">Processes</h2>
						<ProcessList
							activity={activity}
							activityId={activity.id}
							userRole={session?.user.role as string}
						/>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
