"use client";

import { Button, Modal, Surface } from "@heroui/react";

interface DetailsModalProps {
	title: string;
	data: Record<string, string>;
}

export function DetailsModal({ title, data }: DetailsModalProps) {
	return (
		<Modal.Backdrop>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-[500px]">
					<Modal.CloseTrigger />
					<Modal.Header className="flex flex-col gap-1">
						<Modal.Heading className="font-bold text-2xl">
							{title}
						</Modal.Heading>
						{/* <p className="text-muted-foreground text-sm">
							Full activity details and metadata
						</p> */}
					</Modal.Header>
					<Modal.Body>
						<Surface className="grid gap-6 rounded-2xl p-4" variant="secondary">
							{Object.keys(data)
								.filter(
									(col) =>
										!["主題", "StartAt", "EndAt", "組別", "負責人"].includes(
											col,
										),
								)
								.map((col) => (
									<div className="flex flex-col gap-1.5" key={col}>
										<div className="flex items-center gap-2">
											<div className="h-1.5 w-1.5 rounded-full bg-primary" />
											<span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
												{col}
											</span>
										</div>
										<div className="ml-0.5 whitespace-pre-wrap border-divider border-l-2 pl-3.5 text-sm leading-relaxed">
											{data[col] ?? "-"}
										</div>
									</div>
								))}
						</Surface>
					</Modal.Body>
					<Modal.Footer>
						<Button className="w-full" slot="close">
							Close
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
