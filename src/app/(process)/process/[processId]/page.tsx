import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { ProcessPageClient } from "./ProcessPageClient";

export default async function ProcessPage({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in");
	}

	return <ProcessPageClient params={params} />;
}
