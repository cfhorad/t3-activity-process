import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { getCachedProcess } from "~/server/cache/process";
import { db } from "~/server/db";
import { userAreas } from "~/server/db/schema";
import { WebPageClient } from "./WebPageClient";

export default async function WebPage({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	const resolvedParams = await params;
	const processId = parseInt(resolvedParams.processId, 10);

	const process = await getCachedProcess(processId);

	if (!process) {
		redirect("/");
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

	// Verify area access (Admins have access to all areas)
	const isSuperAdmin = session.user.role === "ADMIN";
	const hasAccess =
		isSuperAdmin ||
		(process.activity.areaId !== null &&
			areaIds.includes(process.activity.areaId));

	if (!hasAccess) {
		redirect("/pending-approval");
	}

	return <WebPageClient process={process} />;
}
