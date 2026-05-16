"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { PageHeader } from "~/app/_components/page-header";
import { api } from "~/trpc/react";

export function WebPageClient({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const { processId } = use(params);
	const id = parseInt(processId, 10);
	const router = useRouter();

	const { data: process, isLoading } = api.process.getById.useQuery({ id });

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!process) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground text-xl">Process not found</p>
				<Button onPress={() => router.back()} variant="secondary">
					Go Back
				</Button>
			</div>
		);
	}

	return (
		<main className="h-full bg-linear-to-b from-background to-content2 p-4 md:p-8">
			<div className="mx-auto flex h-full max-w-7xl flex-col">
				<PageHeader
					backHref={process ? `/activity/${process.activityId}` : "/"}
					backLabel={process?.activity?.name ?? "返回活動"}
					title={process.name}
				/>

				{/* MEMO: 調整WebPage外觀. */}
				<div className="relative flex-1 bg-content2 p-0">
					{process.iframeSrc ? (
						<Card className="h-full w-full overflow-hidden shadow-sm">
							<iframe
								className="h-full w-full border-none bg-background"
								src={process.iframeSrc}
								title={process.name}
							/>
						</Card>
					) : (
						<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
							<Card className="max-w-md p-8">
								<p className="font-medium text-muted-foreground">
									No iframe source URL found for this process.
								</p>
								<p className="mt-2 text-muted-foreground text-sm">
									Please edit the process to add an iframe embed code.
								</p>
							</Card>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
