"use client";

import { buttonVariants, Card, Spinner } from "@heroui/react";
import { ChevronRight, TableProperties } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

import { ProcessActions } from "./process-actions";

export function ProcessList({
	activityId,
	userRole,
}: {
	activityId: number;
	userRole: string;
}) {
	const { data: processes, isLoading } = api.process.getByActivityId.useQuery({
		activityId,
	});

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Spinner />
					<span className="text-muted-foreground text-small">
						Loading processes...
					</span>
				</div>
			</div>
		);
	}

	if (!processes || processes.length === 0) {
		return (
			<div className="flex h-48 flex-col items-center justify-center rounded-2xl border-2 border-divider border-dashed bg-content1/50 p-8 text-center">
				<TableProperties className="mb-4 h-10 w-10 text-muted-foreground" />
				<h3 className="font-bold">No processes defined</h3>
				<p className="text-muted-foreground text-small">
					Add a process to start syncing data from sheets.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{processes.map((process) => (
				<Card
					className="bg-content1 transition-colors hover:bg-content2"
					key={process.id}
				>
					<Card.Header className="flex items-center justify-between px-6 py-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
								<TableProperties className="h-5 w-5" />
							</div>
							<div className="flex flex-1 items-center justify-between">
								<div className="flex flex-col">
									<Card.Title className="font-bold text-sm">
										{process.name}
									</Card.Title>
									<Card.Description className="text-muted-foreground text-xs">
										Sheet: {process.sheetName}
									</Card.Description>
								</div>
								<ProcessActions process={process} userRole={userRole} />
							</div>
						</div>
					</Card.Header>
					<Card.Footer className="px-6 py-4 pt-0">
						<Link
							className={buttonVariants({
								variant: "secondary",
								size: "sm",
								fullWidth: true,
								className: "justify-between",
							})}
							href={`/process/${process.id}`}
						>
							View Data
							<ChevronRight className="h-4 w-4" />
						</Link>
					</Card.Footer>
				</Card>
			))}
		</div>
	);
}
