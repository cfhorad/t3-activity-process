import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
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
					<div className="mb-12 grid grid-cols-3 items-center gap-6">
						<div className="flex items-center">
							<Link
								className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
								href="/"
							>
								<ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
								返回儀表板
							</Link>
						</div>
						<h1 className="text-center font-bold text-3xl tracking-tight md:text-4xl">
							{activity.name}
						</h1>
						<div className="flex justify-end">
							{session && (
								<CreateProcessButton
									activityId={activity.id}
									userRole={session.user.role as string}
								/>
							)}
						</div>
					</div>

					<div className="space-y-6">
						<h2 className="font-bold text-2xl">項目清單</h2>
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
