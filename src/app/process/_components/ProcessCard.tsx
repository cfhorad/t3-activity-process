"use client";

import { Button, Card, Chip, Modal } from "@heroui/react";
import { Clock, Info, Layers, Users } from "lucide-react";
import { DetailsModal } from "./DetailsModal";

interface ProcessCardProps {
	row: {
		id: number;
		data: unknown;
		isAlwaysShow: boolean;
	};
}

export function ProcessCard({ row }: ProcessCardProps) {
	const data = (row.data as Record<string, string>) ?? {};
	const title = data.主題 ?? "Untitled";
	const footerField = "負責人";

	return (
		<Card
			className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
			variant="secondary"
		>
			<Card.Header>
				<Card.Title className="line-clamp-2 font-bold text-lg transition-colors group-hover:text-primary">
					{title}
				</Card.Title>
				<div className="card__description mt-4 flex flex-col gap-2.5 text-sm">
					<div className="flex items-center gap-2">
						<Clock className="size-4 text-primary" />
						<div className="flex flex-col">
							{/* <span className="font-medium text-[10px] text-muted-foreground uppercase">
								Time
							</span> */}
							<span className="font-semibold text-foreground">
								{data.StartAt ?? "-"} — {data.EndAt ?? "-"}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Layers className="size-4 text-primary" />
						<div className="flex flex-col">
							{/* <span className="font-medium text-[10px] text-muted-foreground uppercase">
								Group
							</span> */}
							<div className="mt-0.5 flex flex-wrap gap-1">
								{(data.組別 ?? "-").split(/[,\n\r]+/).map((g) => (
									<Chip color="accent" key={g.trim()} size="sm" variant="soft">
										{g.trim()}
									</Chip>
								))}
							</div>
						</div>
					</div>
				</div>
			</Card.Header>
			<Card.Footer className="mt-auto flex items-center justify-between gap-2 border-divider border-t pt-4">
				<div className="flex items-center gap-2">
					<div className="rounded-full bg-primary/10 p-2">
						<Users className="size-4 text-primary" />
					</div>
					<div className="flex flex-col">
						{/* <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
							{footerField}
						</span> */}
						<span className="font-bold text-sm">
							{data[footerField] ?? "-"}
						</span>
					</div>
				</div>

				<Modal>
					<Button className="font-semibold" size="sm" variant="tertiary">
						<Info className="size-3.5" />
						Details
					</Button>
					<DetailsModal data={data} title={title} />
				</Modal>
			</Card.Footer>
		</Card>
	);
}
