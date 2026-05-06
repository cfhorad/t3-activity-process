"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "~/server/better-auth/client";
import { AuthCard } from "../_components/auth/auth-card";

function AuthPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");

	// Default to register if tab=register, otherwise login
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

export default function AuthPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<AuthPageContent />
		</Suspense>
	);
}
