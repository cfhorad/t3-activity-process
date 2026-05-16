"use client";

import { Modal, Surface, Tooltip } from "@heroui/react";
import { Info, Phone } from "lucide-react";

interface DetailsModalProps {
	data: Record<string, string>;
	title: string;
}

export function DetailsModal({ data, title }: DetailsModalProps) {
	return (
		<Modal.Backdrop variant="blur">
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-default text-foreground">
							<Info className="size-5" />
						</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="p-0">
						<Surface
							className="max-h-[60vh] overflow-y-auto p-6"
							variant="default"
						>
							<div className="flex flex-col gap-4">
								{Object.entries(data).map(([key, value]) => (
									<div className="flex flex-col gap-1" key={key}>
										<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											{key}
										</span>
										<div className="whitespace-pre-wrap font-medium text-sm leading-relaxed">
											{(key === "電話" || key === "手機") && value ? (
												<Tooltip closeDelay={0} delay={0}>
													<Tooltip.Trigger>
														<a
															className="flex w-fit items-center gap-2 rounded-lg bg-success-soft px-3 py-1.5 text-success transition-colors hover:bg-success-soft-hover"
															href={`tel:${value.replace(/\s/g, "")}`}
														>
															<Phone className="size-4" />
															<span className="font-semibold text-xs">
																撥打電話
															</span>
														</a>
													</Tooltip.Trigger>
													<Tooltip.Content placement="top">
														撥打 {value}
													</Tooltip.Content>
												</Tooltip>
											) : (
												value || "-"
											)}
										</div>
									</div>
								))}
							</div>
						</Surface>
					</Modal.Body>
					<Modal.Footer />
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
