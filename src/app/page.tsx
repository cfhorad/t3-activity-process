import { SignInButton, SignOutButton } from "~/app/_components/auth-buttons";
import { ActivityList } from "~/app/activity/ActivityList";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
	const session = await getSession();

	if (session) {
		void api.activity.getAll.prefetch();
	}

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						<span className="text-[hsl(280,100%,70%)]">Activity</span> Manager
					</h1>

					<div className="flex flex-col items-center gap-2">
						<div className="flex flex-col items-center justify-center gap-4">
							<p className="text-center text-2xl text-white">
								{session && <span>Logged in as {session.user?.name}</span>}
							</p>
							{!session ? <SignInButton /> : <SignOutButton />}
						</div>
					</div>

					{session?.user && <ActivityList />}
				</div>
			</main>
		</HydrateClient>
	);
}
