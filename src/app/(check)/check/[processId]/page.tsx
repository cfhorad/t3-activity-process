import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { CheckPageClient } from "./CheckPageClient";

export default async function CheckPage({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	return <CheckPageClient params={params} user={session.user} />;
}
