"use client";

import { Spinner } from "@heroui/react";

export function GlobalSpinner() {
	return (
		<div className="flex h-64 items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<Spinner size="lg" />
				<span className="animate-pulse font-semibold text-muted-foreground text-sm">
					正在載入中...
				</span>
			</div>
		</div>
	);
}

export default function Loading() {
	return (
		<div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4">
			<Spinner size="lg" />
			<span className="animate-pulse font-semibold text-muted-foreground text-sm">
				正在載入頁面...
			</span>
		</div>
	);
}
