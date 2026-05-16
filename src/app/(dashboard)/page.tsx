import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { PageHeader } from "../_components/page-header";
import { ActivityList } from "./_components/activity-list";
import { CreateActivityButton } from "./_components/create-activity-button";

export default async function DashboardPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	await api.activity.getAll.prefetch();

	return (
		<HydrateClient>
			<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					<PageHeader
						action={<CreateActivityButton userRole={session.user.role as string} />}
						title="活動管理"
					/>

					<ActivityList userRole={session.user.role as string} />
				</div>
			</main>
		</HydrateClient>
	);
}
