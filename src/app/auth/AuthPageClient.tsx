"use client";

import { useRouter } from "next/navigation";
import { authClient } from "~/server/better-auth/client";
import { AuthCard } from "../_components/auth/auth-card";

interface AuthPageClientProps {
	defaultTab: "register" | "login";
}

export function AuthPageClient({ defaultTab }: AuthPageClientProps) {
	const router = useRouter();

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
