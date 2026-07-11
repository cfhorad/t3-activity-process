import { Spinner } from "@heroui/react";
import { Suspense } from "react";
import { AuthPageClient } from "./AuthPageClient";

export default function AuthPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
					<Spinner size="lg" />
				</div>
			}
		>
			<AuthPageClient />
		</Suspense>
	);
}
