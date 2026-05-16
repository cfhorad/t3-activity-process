"use client";

import { Breadcrumbs } from "@heroui/react";
import Link from "next/link";
import type React from "react";

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface PageHeaderProps {
	title: string;
	breadcrumbs: BreadcrumbItem[];
	action?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-4">
			<Breadcrumbs aria-label="麵包屑導覽">
				{breadcrumbs.map((item) => (
					<Breadcrumbs.Item key={item.label}>
						{item.href ? (
							<Link className="link hover:underline" href={item.href}>
								{item.label}
							</Link>
						) : (
							item.label
						)}
					</Breadcrumbs.Item>
				))}
			</Breadcrumbs>

			<div className="grid min-h-[48px] grid-cols-[1fr_auto_1fr] items-center">
				<div />
				<h1 className="text-center font-bold text-2xl tracking-tight sm:text-3xl">
					{title}
				</h1>
				<div className="flex justify-end">{action}</div>
			</div>
		</div>
	);
}
