import { LayoutGrid } from "lucide-react";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { ActivityList } from "./_components/activity-list";
import { CreateActivityButton } from "./_components/create-activity-button";

export default async function DashboardPage() {
	const session = await getSession();

	if (session) {
		void api.activity.getAll.prefetch();
	}

	return (
		<HydrateClient>
			<main className="min-h-screen bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					<header className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
						<div>
							<h1 className="font-extrabold text-4xl tracking-tight sm:text-5xl">
								Activity <span className="text-primary">Dashboard</span>
							</h1>
							<p className="mt-2 text-muted-foreground text-xl">
								Manage your activities and connected Google Sheets.
							</p>
						</div>
						<div className="flex items-center gap-4">
							{session && (
								<CreateActivityButton userRole={session.user.role as string} />
							)}
						</div>
					</header>

					{session ? (
						<ActivityList userRole={session.user.role as string} />
					) : (
						<div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-12 text-center">
							<LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="font-bold text-xl">
								Welcome to Activity Dashboard
							</h3>
							<p className="text-muted-foreground">
								Please sign in to manage your activities and spreadsheets.
							</p>
						</div>
					)}
				</div>
			</main>
		</HydrateClient>
	);
}
