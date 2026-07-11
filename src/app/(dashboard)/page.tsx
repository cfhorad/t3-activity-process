import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GlobalSpinner } from "~/app/loading";
import { getSession } from "~/server/better-auth/server";
import { PageHeader } from "../_components/page-header";
import { CreateActivityButton } from "./_components/create-activity-button";
import { PrefetchedActivityList } from "./_components/prefetched-activity-list";

export default async function DashboardPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	if (
		session.user.status === "pending" ||
		session.user.status === "suspended"
	) {
		redirect("/pending-approval");
	}

	return (
		<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
			<div className="mx-auto max-w-7xl">
				<PageHeader action={<CreateActivityButton />} title="活動管理" />

				<Suspense fallback={<GlobalSpinner />}>
					<PrefetchedActivityList />
				</Suspense>
			</div>
		</main>
	);
}
