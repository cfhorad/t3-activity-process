import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { ProfileClient } from "./_components/ProfileClient";

export default async function ProfilePage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	// Prefetch the data for areas and statuses
	await api.user.getPublicAreas.prefetch();
	await api.user.getMyAreaStatuses.prefetch();

	return (
		<HydrateClient>
			<main className="flex h-full items-center justify-center bg-linear-to-b from-background to-surface-secondary p-4 md:p-8">
				<ProfileClient user={session.user} />
			</main>
		</HydrateClient>
	);
}
