"use client";

import { Button, Card, Chip, Modal, Tooltip } from "@heroui/react";
import { Bell, Clock, Info, Layers, Phone, Users } from "lucide-react";
import { calculateDuration, formatTimeDisplay } from "~/lib/time";
import { DetailsModal } from "./DetailsModal";

interface ProcessCardProps {
	row: {
		id: number;
		data: unknown;
	};
}

export function ProcessCard({ row }: ProcessCardProps) {
	const data = (row.data as Record<string, string>) ?? {};
	const title = data.主題 ?? "Untitled";
	const footerField: string = "負責人";
	const duration = calculateDuration(data.StartAt, data.EndAt);

	return (
		<Card
			className="group mx-auto h-full w-full max-w-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
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
							<div className="flex flex-col gap-1">
								<span className="font-semibold text-foreground">
									{formatTimeDisplay(data.StartAt)} —{" "}
									{formatTimeDisplay(data.EndAt)}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
						<div className="flex items-center gap-2">
							<Bell className="size-4 text-primary" />
							<div className="flex flex-col">
								<div className="flex flex-col gap-1">
									{duration && (
										<Chip
											className="h-auto px-0 font-semibold text-foreground"
											color="success"
											size="sm"
											variant="soft"
										>
											{duration}
										</Chip>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Layers className="size-4 text-primary" />
							<div className="flex flex-col">
								<div className="flex flex-wrap gap-1">
									{(data.組別 ?? "-").split(/[,\n\r]+/).map((g) => (
										<Chip
											color="accent"
											key={g.trim()}
											size="sm"
											variant="soft"
										>
											{g.trim()}
										</Chip>
									))}
								</div>
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
						<span className="font-bold text-sm">
							{(footerField === "電話" || footerField === "手機") &&
							data[footerField] ? (
								<Tooltip closeDelay={0} delay={0}>
									<Tooltip.Trigger>
										<a
											className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success transition-colors hover:bg-success-soft-hover"
											href={`tel:${data[footerField].replace(/\s/g, "")}`}
										>
											<Phone className="size-4" />
										</a>
									</Tooltip.Trigger>
									<Tooltip.Content placement="top">
										撥打 {data[footerField]}
									</Tooltip.Content>
								</Tooltip>
							) : (
								(data[footerField] ?? "-")
							)}
						</span>
					</div>
				</div>

				<Modal>
					<Button className="font-semibold" size="sm" variant="tertiary">
						<Info className="size-3.5" />
						詳細資訊
					</Button>
					<DetailsModal data={data} title={title} />
				</Modal>
			</Card.Footer>
		</Card>
	);
}
