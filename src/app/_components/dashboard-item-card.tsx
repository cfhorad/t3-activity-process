"use client";

import { Accordion, Button, Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardItemCardProps {
	// Content
	title: string | ReactNode;
	chip?: ReactNode;
	date: string;
	description?: ReactNode;

	// Visuals
	icon: string;

	// Interactions
	onClick?: () => void;

	// Actions (Accordion)
	showEditDelete?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	customActions?: ReactNode;
}

export function DashboardItemCard({
	title,
	chip,
	date,
	description,
	icon,
	onClick,
	showEditDelete,
	onEdit,
	onDelete,
	customActions,
}: DashboardItemCardProps) {
	// Format weekday in Chinese
	const formattedDate = (dateStr: string) => {
		try {
			const d = new Date(dateStr);
			const weekday = new Intl.DateTimeFormat("zh-TW", {
				weekday: "short",
			}).format(d);
			return `${dateStr} (${weekday})`;
		} catch (_e) {
			return dateStr;
		}
	};

	const hasActions = showEditDelete || customActions;

	return (
		<Card
			className="group flex w-full cursor-pointer flex-row items-stretch transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
			onClick={onClick}
			variant="secondary"
		>
			<div className="relative flex w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-l-2xl bg-linear-to-br from-zinc-900 to-accent/40 shadow-inner md:w-[110px]">
				<div className="absolute inset-0 bg-black/20" />
				<Icon
					className="relative z-10 size-20 text-white/90 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] md:size-24"
					icon={icon}
				/>
			</div>

			<div className="flex flex-1 flex-col overflow-hidden">
				<Card.Header className="flex flex-col items-start gap-0.5 p-4 pb-2">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<Card.Title className="font-bold text-base tracking-tight">
							{title}
						</Card.Title>
						{chip}
						<span className="flex items-center gap-1 text-muted-foreground text-xs">
							<span className="opacity-30">•</span>
							<Calendar className="h-3 w-3" />
							<span>{formattedDate(date)}</span>
						</span>
					</div>
					<Card.Description className="line-clamp-1 text-muted-foreground text-xs">
						{description}
					</Card.Description>
				</Card.Header>

				<Card.Content className="px-4 pt-0 pb-4">
					{hasActions && (
						<Accordion
							className="w-full"
							hideSeparator
							onClick={(e) => e.stopPropagation()}
						>
							<Accordion.Item id="actions">
								<Accordion.Heading>
									<Accordion.Trigger className="py-1 text-muted-foreground text-xs hover:text-foreground">
										更多資訊與操作
										<Accordion.Indicator />
									</Accordion.Trigger>
								</Accordion.Heading>
								<Accordion.Panel>
									<Accordion.Body className="flex flex-col gap-2 pt-2">
										<div className="flex gap-2">
											{showEditDelete && (
												<>
													<Button
														className="h-8 flex-1 text-xs"
														onPress={(e) => {
															e.continuePropagation();
															onEdit?.();
														}}
														variant="secondary"
													>
														<Pencil className="mr-1 h-3 w-3" />
														編輯
													</Button>
													<Button
														className="h-8 flex-1 text-xs"
														onPress={(e) => {
															e.continuePropagation();
															onDelete?.();
														}}
														variant="danger-soft"
													>
														<Trash2 className="mr-1 h-3 w-3 text-danger" />
														刪除
													</Button>
												</>
											)}
										</div>
										{customActions}
									</Accordion.Body>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					)}
				</Card.Content>
			</div>
		</Card>
	);
}
