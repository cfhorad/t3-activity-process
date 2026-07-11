"use client";

import { Spinner } from "@heroui/react";

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
