import { Skeleton } from "@heroui/react";

export function SkeletonGrid() {
	return (
		<div className="grid grid-cols-1 gap-4 p-4">
			{[1, 2, 3, 4].map((i) => (
				<div
					className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-divider p-6"
					key={i}
				>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-6 w-3/4 rounded-lg" />
						<Skeleton className="h-4 w-1/2 rounded-lg" />
					</div>
					<div className="flex gap-4">
						<Skeleton className="h-10 w-24 rounded-xl" />
						<Skeleton className="h-10 w-24 rounded-xl" />
					</div>
					<div className="mt-4 flex items-center justify-between border-divider border-t pt-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-4 w-20 rounded-lg" />
						</div>
						<Skeleton className="h-8 w-24 rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}
