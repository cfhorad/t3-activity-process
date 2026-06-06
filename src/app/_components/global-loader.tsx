"use client";

import { Spinner } from "@heroui/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function GlobalLoader() {
	const [isLoading, setIsLoading] = useState(false);
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		const handleStart = () => setIsLoading(true);
		const handleEnd = () => setIsLoading(false);

		window.addEventListener("navigation-start", handleStart);
		window.addEventListener("navigation-end", handleEnd);

		const handleAnchorClick = (e: MouseEvent) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
				return;
			}
			const anchor = (e.target as HTMLElement).closest("a");
			if (
				anchor?.href &&
				anchor.target !== "_blank" &&
				!anchor.hasAttribute("download")
			) {
				const targetUrl = new URL(anchor.href, window.location.href);
				const currentUrl = new URL(window.location.href);
				if (
					targetUrl.origin === currentUrl.origin &&
					targetUrl.pathname !== currentUrl.pathname
				) {
					setIsLoading(true);
				}
			}
		};

		document.addEventListener("click", handleAnchorClick);

		return () => {
			window.removeEventListener("navigation-start", handleStart);
			window.removeEventListener("navigation-end", handleEnd);
			document.removeEventListener("click", handleAnchorClick);
		};
	}, []);

	// Reset loading state when pathname or searchParams change (navigation completes)
	useEffect(() => {
		if (pathname || searchParams) {
			setIsLoading(false);
		}
	}, [pathname, searchParams]);

	if (!isLoading) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md transition-opacity duration-300">
			<div className="flex flex-col items-center gap-4 rounded-2xl border border-default-100 bg-background/80 p-8 shadow-2xl">
				<Spinner size="lg" />
				<span className="animate-pulse font-semibold text-muted-foreground text-sm">
					正在載入頁面...
				</span>
			</div>
		</div>
	);
}
