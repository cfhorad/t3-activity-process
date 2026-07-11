import { Suspense } from "react";
import { GlobalSpinner } from "~/app/loading";
import { AuthPageClient } from "./AuthPageClient";

export default function AuthPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
					<GlobalSpinner />
				</div>
			}
		>
			<AuthPageClient />
		</Suspense>
	);
}
