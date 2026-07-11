"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "~/server/better-auth/client";
import { AuthCard } from "../_components/auth/auth-card";

export function AuthPageClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");
	const defaultTab = tab === "register" ? "register" : "login";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
			<AuthCard
				authClient={authClient}
				defaultTab={defaultTab}
				onSuccess={() => router.push("/")}
			/>
		</div>
	);
}
