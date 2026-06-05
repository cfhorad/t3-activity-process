"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type React from "react";

interface PageHeaderProps {
	title: string;
	backHref?: string;
	backLabel?: string;
	action?: React.ReactNode;
}

export function PageHeader({
	title,
	backHref,
	backLabel,
	action,
}: PageHeaderProps) {
	return (
		<div className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:mb-12">
			<div className="flex items-center">
				{backHref && (
					<Link
						className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
						href={backHref}
					>
						<ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
						<span>{backLabel ?? "返回"}</span>
					</Link>
				)}
			</div>

			<h1 className="text-center font-bold text-2xl tracking-tight sm:text-3xl md:text-4xl">
				{title}
			</h1>

			<div className="flex justify-end">{action}</div>
		</div>
	);
}
