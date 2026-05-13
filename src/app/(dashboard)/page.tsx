import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
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
					<header className="mb-12 grid grid-cols-3 items-center gap-4">
						<div />
						<h1 className="text-center font-extrabold text-2xl tracking-tight sm:text-3xl">
							活動管理
						</h1>
						<div className="flex items-center justify-end">
							<CreateActivityButton userRole={session.user.role as string} />
						</div>
					</header>

					<ActivityList userRole={session.user.role as string} />
				</div>
			</main>
		</HydrateClient>
	);
}
