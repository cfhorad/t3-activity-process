import { getSession } from "~/server/better-auth/server";
import { PendingApprovalClient } from "./_components/PendingApprovalClient";

export default async function PendingApprovalPage() {
	const session = await getSession();

	if (!session) {
		return null;
	}

	return (
		<main className="flex h-full items-center justify-center bg-linear-to-b from-background to-surface-secondary p-4 md:p-8">
			<PendingApprovalClient user={session.user} />
		</main>
	);
}
