import { Suspense } from "react";
import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";
import { NavbarClient } from "./navbar-client";

async function AuthNavbarInner() {
	const session = await getSession();

	if (session) {
		// Prefetch permissions on the server to prevent client-side waterfalls
		await api.user.getMyPermissions.prefetch();
	}

	return <NavbarClient session={session} />;
}

export function AuthNavbar() {
	return (
		<Suspense fallback={<NavbarClient session={null} />}>
			<AuthNavbarInner />
		</Suspense>
	);
}
