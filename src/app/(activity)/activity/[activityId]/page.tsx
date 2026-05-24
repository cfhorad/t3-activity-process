import { notFound, redirect } from "next/navigation";
import { PageHeader } from "~/app/_components/page-header";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { CreateProcessButton } from "./_components/create-process-button";
import { EditActivityButton } from "./_components/edit-activity-button";
import { ProcessList } from "./_components/process-list";

/**
 * Activity Details & Process Management Page (Server Component)
 *
 * Exposes full management controls for a single Activity:
 * 1. View Activity Metadata (date, memo, area, co-editors list).
 * 2. Edit activity settings (for Creator/Admins/Co-editors).
 * 3. Create, edit, and list processes (flows, check sheets, Web Embeds) under this Activity.
 */
export default async function ActivityPage({
	params,
}: {
	params: Promise<{ activityId: string }>;
}) {
	// ─── 1. EXTRACT ROUTE PARAMETERS & VERIFY SESSION ───────────────────
	const { activityId } = await params;
	const id = parseInt(activityId, 10);
	const session = await getSession();

	// Guard: Redirect to authentication page if no session is active
	if (!session) {
		redirect("/auth");
	}

	// Guard: Return a 404 page if the route ID is invalid
	if (Number.isNaN(id)) {
		notFound();
	}

	// ─── 2. FETCH MAIN ACTIVITY METADATA ────────────────────────────────
	const activity = await api.activity.getById({ id });

	// Guard: Return a 404 page if the activity does not exist
	if (!activity) {
		notFound();
	}

	// ─── 3. PREFETCH DATA FOR SERVER-SIDE HYDRATION ─────────────────────
	// Prefetch the processes list query on the server so that the client component
	// has the data immediately available without layout shifts or loader flashes.
	await api.process.getByActivityId.prefetch({ activityId: id });

	return (
		<HydrateClient>
			<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					{/* ─── 4. PAGE HEADER & MANAGEMENT CONTROLS ───────────────────── */}
					<PageHeader
						action={
							session && (
								<div className="flex items-center gap-2">
									{/* Button to edit Activity metadata & manage "Co-editors" */}
									<EditActivityButton activity={activity} />
									{/* Button to add a new operational process/sheet flow */}
									<CreateProcessButton activity={activity} />
								</div>
							)
						}
						backHref="/"
						backLabel="活動管理"
						title={activity.name}
					/>

					{/* ─── 5. PROCESSES FLOWS AND LISTS ───────────────────────────── */}
					<div className="space-y-6">
						<h2 className="font-bold text-2xl">項目清單</h2>
						<ProcessList activity={activity} activityId={activity.id} />
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
