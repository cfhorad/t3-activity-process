import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "~/app/_components/page-header";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { userAreas } from "~/server/db/schema";
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

	// Fetch approved areaIds for current user
	const approvedAreas = await db
		.select({ areaId: userAreas.areaId })
		.from(userAreas)
		.where(
			and(
				eq(userAreas.userId, session.user.id),
				eq(userAreas.status, "approved"),
			),
		);
	const areaIds = approvedAreas.map((a) => a.areaId);

	const userWithAreas = {
		...session.user,
		areaIds,
	};

	await api.process.getByActivityId.prefetch({ activityId: id });

	return (
		<HydrateClient>
			<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					<PageHeader
						action={
							session && (
								<CreateProcessButton activity={activity} user={userWithAreas} />
							)
						}
						backHref="/"
						backLabel="活動管理"
						title={activity.name}
					/>

					<div className="space-y-6">
						<h2 className="font-bold text-2xl">項目清單</h2>
						<ProcessList
							activity={activity}
							activityId={activity.id}
							user={userWithAreas}
						/>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
