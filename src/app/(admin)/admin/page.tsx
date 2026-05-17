import { and, eq } from "drizzle-orm";
import { PageHeader } from "~/app/_components/page-header";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { userAreas } from "~/server/db/schema";
import { AdminDashboardClient } from "./_components/AdminDashboardClient";

export default async function AdminPage() {
	const session = await getSession();

	if (!session) {
		return null;
	}

	// Fetch current user's approved areas directly on server side
	const myAreas = await db
		.select({ areaId: userAreas.areaId })
		.from(userAreas)
		.where(
			and(
				eq(userAreas.userId, session.user.id),
				eq(userAreas.status, "approved"),
			),
		);

	const areaIds = myAreas.map((a) => a.areaId);

	const currentUser = {
		...session.user,
		role: session.user.role as "ADMIN" | "MANAGER" | "VIEWER",
		areaIds,
	};

	return (
		<main className="min-h-screen bg-linear-to-b from-background to-surface-secondary p-4 md:p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				<PageHeader title="後台權限與地區審核管理系統" />
				<AdminDashboardClient currentUser={currentUser} />
			</div>
		</main>
	);
}
