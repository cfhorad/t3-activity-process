"use client";

import { Modal, Surface } from "@heroui/react";
import { Info } from "lucide-react";

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
											{value || "-"}
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
