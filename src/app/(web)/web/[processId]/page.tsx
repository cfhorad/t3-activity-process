import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
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

	return <WebPageClient params={params} />;
}
