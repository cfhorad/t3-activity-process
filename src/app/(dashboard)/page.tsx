import { SignInButton, SignOutButton } from "~/app/_components/auth-buttons";
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
							{session ? (
								<>
									<div className="hidden text-right sm:block">
										<p className="font-medium">{session.user.name}</p>
										<p className="text-muted-foreground text-xs">
											{session.user.email}
										</p>
									</div>
									<CreateActivityButton
										userRole={session.user.role as string}
									/>
									<SignOutButton />
								</>
							) : (
								<SignInButton />
							)}
						</div>
					</header>

					<ActivityList userRole={session?.user.role as string} />
				</div>
			</main>
		</HydrateClient>
	);
}
