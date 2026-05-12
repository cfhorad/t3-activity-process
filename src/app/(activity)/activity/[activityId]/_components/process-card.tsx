"use client";

import { Card, Chip } from "@heroui/react";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProcessActions } from "./process-actions";

interface ProcessCardProps {
	process: {
		id: number;
		name: string;
		sheetName: string;
		type: "PROCESS" | "CHECK" | "WEB";
		activityId: number;
		processDate: string;
		processMemo?: string | null;
		iframeSrc?: string | null;
	};
	userRole: string;
}

export function ProcessCard({ process, userRole }: ProcessCardProps) {
	const router = useRouter();

	return (
		<Card
			className="group w-full cursor-pointer items-stretch transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:flex-row"
			onClick={() =>
				router.push(
					process.type === "CHECK"
						? `/check/${process.id}`
						: process.type === "WEB"
							? `/web/${process.id}`
							: `/process/${process.id}`,
				)
			}
			variant="secondary"
		>
			<div className="relative h-[160px] w-full shrink-0 overflow-hidden rounded-t-2xl md:h-auto md:w-[200px] md:rounded-l-2xl md:rounded-tr-none">
				<Image
					alt={process.name}
					className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-110"
					fill
					priority
					src="/images/process-hero.png"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
			</div>

			<div className="flex flex-1 flex-col">
				<Card.Header className="flex flex-col items-start gap-1 px-6 pt-6">
					<div className="flex w-full items-center justify-between">
						<Card.Title className="flex items-center gap-2 font-bold text-xl tracking-tight">
							<span className="truncate">{process.name}</span>
							<Chip
								color={
									process.type === "CHECK"
										? "success"
										: process.type === "WEB"
											? "warning"
											: "accent"
								}
								size="sm"
								variant="soft"
							>
								{process.type === "CHECK"
									? "報到清單"
									: process.type === "WEB"
										? "網頁嵌入"
										: "流程處理"}
							</Chip>
						</Card.Title>
					</div>
					<Card.Description className="flex w-full items-center justify-between gap-4 text-muted-foreground text-sm">
						<span className="line-clamp-1">
							{process.processMemo || `Sheet: ${process.sheetName}`}
						</span>
						<span className="flex shrink-0 items-center gap-1.5 font-medium">
							<Calendar className="h-3.5 w-3.5" />
							<span>{process.processDate}</span>
						</span>
					</Card.Description>
				</Card.Header>

				<Card.Footer className="mt-auto flex items-center justify-end border-divider border-t px-6 py-4">
					<ProcessActions process={process} userRole={userRole} />
				</Card.Footer>
			</div>
		</Card>
	);
}
