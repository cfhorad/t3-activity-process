"use client";

import { Card, Skeleton } from "@heroui/react";

export function SkeletonGrid() {
	return (
		<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: 8 }).map((_, i) => (
				<Card
					className="h-[200px] gap-3"
					// biome-ignore lint/suspicious/noArrayIndexKey: skeletons are static
					key={`skeleton-card-${i}`}
				>
					<Card.Header className="flex flex-col gap-2">
						<Skeleton className="h-6 w-3/4 rounded-lg" />
						<Skeleton className="h-4 w-1/2 rounded-lg" />
					</Card.Header>
					<Card.Content className="flex flex-col gap-2">
						<Skeleton className="h-3 w-full rounded-lg" />
						<Skeleton className="h-3 w-5/6 rounded-lg" />
					</Card.Content>
					<Card.Footer className="mt-auto">
						<Skeleton className="h-10 w-full rounded-lg" />
					</Card.Footer>
				</Card>
			))}
		</div>
	);
}
