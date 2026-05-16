"use client";

import { Modal } from "@heroui/react";
import type { Column, DataRow } from "./CheckListTable";

interface RowInfoModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	row: DataRow | null;
	allColumns: Column[];
}

export function RowInfoModal({
	isOpen,
	onOpenChange,
	row,
	allColumns,
}: RowInfoModalProps) {
	if (!row) return null;
	const rowData = row.data as Record<string, unknown>;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>詳細數據資訊</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="space-y-4 pb-6">
						<div className="grid grid-cols-1 gap-3 rounded-xl bg-content2 p-4 text-sm sm:grid-cols-2">
							{allColumns.map((col) => {
								const val = rowData[col.columnName];
								return (
									<div
										className="flex flex-col gap-1 border-divider border-b pb-2 last:border-0 last:pb-0"
										key={col.columnName}
									>
										<p className="font-semibold text-muted-foreground text-xs">
											{col.columnName}
										</p>
										<p className="font-medium">
											{col.isCheckbox ? (
												<span className={val ? "text-success" : "text-danger"}>
													{val ? "✅ 已核取" : "❌ 未核取"}
												</span>
											) : (
												val?.toString() || "—"
											)}
										</p>
									</div>
								);
							})}
						</div>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
