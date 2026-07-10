import { Suspense } from "react";
import { AuthPageClient } from "./AuthPageClient";

interface PageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuthPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const tab = typeof params.tab === "string" ? params.tab : undefined;
	const defaultTab = tab === "register" ? "register" : "login";

	return (
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<AuthPageClient defaultTab={defaultTab} />
		</Suspense>
	);
}
