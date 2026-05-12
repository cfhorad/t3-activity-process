"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
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
		<main className="flex h-full flex-col overflow-hidden bg-background">
			<header className="flex h-16 shrink-0 items-center justify-between border-divider border-b px-4 md:px-8">
				<div className="flex items-center gap-4">
					<Button
						isIconOnly
						onPress={() => router.back()}
						size="sm"
						variant="secondary"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-lg leading-none">{process.name}</h1>
						<p className="mt-1 text-muted-foreground text-xs">
							{process.sheetName}
						</p>
					</div>
				</div>
			</header>

			<div className="relative flex-1 bg-content2">
				{process.iframeSrc ? (
					<iframe
						className="h-full w-full border-none"
						src={process.iframeSrc}
						title={process.name}
					/>
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
		</main>
	);
}
