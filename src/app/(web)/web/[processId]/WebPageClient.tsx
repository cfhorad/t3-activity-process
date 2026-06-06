"use client";

import { Card, Spinner } from "@heroui/react";
import { useState } from "react";
import { PageHeader } from "~/app/_components/page-header";

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Active Iframe View Component
 */
interface IframeViewProps {
	src: string;
	title: string;
}

function IframeView({ src, title }: IframeViewProps) {
	const [isIframeLoading, setIsIframeLoading] = useState(true);

	return (
		<Card className="relative h-full w-full overflow-hidden">
			{isIframeLoading && (
				<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-xs">
					<Spinner size="lg" />
					<p className="animate-pulse font-medium text-muted text-sm">
						載入嵌入頁面中...
					</p>
				</div>
			)}
			<iframe
				className="h-full w-full border-none bg-background"
				onLoad={() => setIsIframeLoading(false)}
				src={src}
				title={title}
			/>
		</Card>
	);
}

/**
 * 2. Warning Card for Missing Iframe Src Component
 */
function NoIframeWarning() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
			<Card className="max-w-md p-8">
				<p className="font-medium text-muted">
					No iframe source URL found for this process.
				</p>
				<p className="mt-2 text-muted text-sm">
					Please edit the process to add an iframe embed code.
				</p>
			</Card>
		</div>
	);
}

import type { Process } from "~/server/db/schema";

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function WebPageClient({ process }: { process: Process }) {
	return (
		<main className="h-full bg-linear-to-b from-background to-surface-secondary p-4 md:p-8">
			<div className="mx-auto flex h-full max-w-7xl flex-col">
				<PageHeader
					backHref={process ? `/activity/${process.activityId}` : "/"}
					backLabel="返回"
					title={process.name}
				/>

				<div className="relative flex-1 bg-surface-secondary p-0">
					{process.iframeSrc ? (
						<IframeView src={process.iframeSrc} title={process.name} />
					) : (
						<NoIframeWarning />
					)}
				</div>
			</div>
		</main>
	);
}
