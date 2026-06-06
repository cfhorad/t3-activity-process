"use client";

import { Button, Card } from "@heroui/react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useState } from "react";

export default function OfflinePage() {
	const [isReloading, setIsReloading] = useState(false);

	const handleRetry = () => {
		setIsReloading(true);
		window.location.reload();
	};

	return (
		<div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-12">
			{/* Background Ambient Glows */}
			<div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
			<div className="absolute bottom-1/4 left-1/3 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

			<Card className="relative w-full max-w-md border border-default-100 bg-background/60 p-8 text-center shadow-2xl backdrop-blur-xl">
				<div className="flex flex-col items-center gap-6">
					{/* Glowing pulsing icon container */}
					<div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-500/20 to-violet-500/20 text-blue-500 shadow-inner">
						<WifiOff className="size-10 animate-pulse text-blue-400" />
						<span className="absolute -top-1 -right-1 flex h-4 w-4">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
							<span className="relative inline-flex h-4 w-4 rounded-full bg-violet-500" />
						</span>
					</div>

					<div className="space-y-2">
						<h1 className="font-bold text-2xl text-foreground tracking-tight">
							您目前處於離線狀態
						</h1>
						<p className="text-muted-foreground text-sm leading-relaxed">
							無法連線至網際網路。請檢查您的 Wi-Fi 或行動網路連線，然後重試。
						</p>
					</div>

					{/* Connection Status indicator card */}
					<div className="w-full rounded-xl border border-default-100/50 bg-default-50 p-4 text-left">
						<div className="flex items-center gap-3 text-muted-foreground text-xs">
							<div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
							<span>正在等待網路回復...</span>
						</div>
						<div className="mt-2 text-muted-foreground/80 text-xs leading-normal">
							系統會在網路恢復時自動重新連線。您也可以手動點擊下方按鈕重新整理頁面。
						</div>
					</div>

					<Button
						className="w-full bg-linear-to-r from-blue-600 to-violet-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-500 hover:to-violet-500"
						isPending={isReloading}
						onPress={handleRetry}
						size="lg"
					>
						{!isReloading && (
							<RefreshCw className="mr-2 size-4 animate-spin-slow" />
						)}
						{isReloading ? "正在重新連線..." : "重新嘗試連線"}
					</Button>
				</div>
			</Card>
		</div>
	);
}
