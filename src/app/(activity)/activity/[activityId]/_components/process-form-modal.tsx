"use client";

import {
	Button,
	Form,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	TextArea,
	TextField,
} from "@heroui/react";
import { Pencil, Plus, Sheet } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

interface ProcessFormData {
	name: string;
	sheetName: string;
	type: "PROCESS" | "CHECK" | "WEB";
	processDate: string;
	processMemo?: string | null;
	iframeSrc?: string | null;
}

interface ProcessFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: ProcessFormData) => void;
	isPending: boolean;
	activityId: number;
	initialData?: {
		name: string;
		sheetName: string;
		type: "PROCESS" | "CHECK" | "WEB";
		processDate: string;
		processMemo?: string | null;
		iframeSrc?: string | null;
	};
	title: string;
	description?: string;
	submitLabel: string;
	mode: "create" | "edit";
}

export function ProcessFormModal({
	isOpen,
	onClose,
	onOpenChange,
	onSubmit,
	isPending,
	activityId,
	initialData,
	title,
	description,
	submitLabel,
	mode,
}: ProcessFormModalProps) {
	const [selectedSheet, setSelectedSheet] = useState<string>(
		initialData?.sheetName ?? "",
	);
	const [selectedType, setSelectedType] = useState<"PROCESS" | "CHECK" | "WEB">(
		initialData?.type ?? "PROCESS",
	);

	// Reset selected sheet when initialData changes (for Edit mode)
	useEffect(() => {
		if (initialData?.sheetName) {
			setSelectedSheet(initialData.sheetName);
			setSelectedType(initialData.type);
		} else if (mode === "create") {
			setSelectedSheet("");
			setSelectedType("PROCESS");
		}
	}, [initialData, mode]);

	const { data: activity } = api.activity.getById.useQuery(
		{ id: activityId },
		{ enabled: isOpen },
	);

	const { data: sheetNames, isLoading: isLoadingSheets } =
		api.googleSheet.getSheetMetadata.useQuery(
			{ spreadsheetId: activity?.googleSheetId ?? "" },
			{ enabled: !!activity?.googleSheetId && isOpen },
		);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const sheetName = selectedSheet;
		const type = selectedType;
		const processDate = formData.get("processDate") as string;
		const processMemo = formData.get("processMemo") as string;
		const iframeCode = formData.get("iframeCode") as string;

		let iframeSrc: string | null = initialData?.iframeSrc ?? null;
		if (type === "WEB" && iframeCode) {
			const srcMatch = iframeCode.match(/src="([^"]+)"/);
			iframeSrc = (srcMatch ? srcMatch[1] : iframeCode) ?? null;
		}

		onSubmit({
			name,
			sheetName,
			type,
			processDate,
			processMemo,
			iframeSrc,
		});
	};

	return (
		<Modal.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open && mode === "create") {
					setSelectedSheet("");
				}
			}}
		>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-secondary/10 text-secondary">
							{mode === "create" ? (
								<Plus className="h-5 w-5" />
							) : (
								<Pencil className="h-5 w-5" />
							)}
						</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
						{description && (
							<p className="mt-1.5 text-muted-foreground text-sm">
								{description}
							</p>
						)}
					</Modal.Header>

					<Form onSubmit={handleSubmit}>
						<Modal.Body className="p-6">
							<div className="flex flex-col gap-4">
								<TextField
									defaultValue={initialData?.name ?? ""}
									isRequired
									name="name"
								>
									<Label>Process Name</Label>
									<Input
										placeholder={
											mode === "create" ? "e.g. Master List" : undefined
										}
										variant="secondary"
									/>
								</TextField>

								<Select
									isRequired
									onChange={(val) => {
										setSelectedSheet(val as string);
									}}
									placeholder={
										isLoadingSheets ? "Loading sheets..." : "Select a sheet"
									}
									value={selectedSheet}
									variant="secondary"
								>
									<Label>Google Sheet Tab Name</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{(sheetNames ?? []).map((name) => (
												<ListBox.Item id={name} key={name} textValue={name}>
													<Sheet className="mr-2 h-4 w-4 text-muted-foreground" />
													{name}
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>

								<Select
									isRequired
									onChange={(val) => {
										setSelectedType(val as "PROCESS" | "CHECK" | "WEB");
									}}
									value={selectedType}
									variant="secondary"
								>
									<Label>Process Type</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											<ListBox.Item id="PROCESS" textValue="流程處理">
												流程處理
											</ListBox.Item>
											<ListBox.Item id="CHECK" textValue="報到清單">
												報到清單
											</ListBox.Item>
											<ListBox.Item id="WEB" textValue="網頁嵌入">
												網頁嵌入
											</ListBox.Item>
										</ListBox>
									</Select.Popover>
								</Select>

								{selectedType === "WEB" && (
									<TextField
										defaultValue={initialData?.iframeSrc ?? ""}
										isRequired
										name="iframeCode"
									>
										<Label>Iframe Embed Code</Label>
										<TextArea
											placeholder='e.g. <iframe src="..."></iframe>'
											variant="secondary"
										/>
									</TextField>
								)}

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<TextField
										defaultValue={initialData?.processDate ?? ""}
										isRequired
										name="processDate"
									>
										<Label>Process Date</Label>
										<Input type="date" variant="secondary" />
									</TextField>
								</div>
								<TextField
									defaultValue={initialData?.processMemo ?? ""}
									name="processMemo"
								>
									<Label>Memo (Optional)</Label>
									<Input
										placeholder={
											mode === "create" ? "Add a memo..." : undefined
										}
										variant="secondary"
									/>
								</TextField>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button onPress={onClose} variant="secondary">
								Cancel
							</Button>
							<Button
								isDisabled={!selectedSheet}
								isPending={isPending}
								type="submit"
							>
								{isPending ? `${submitLabel}...` : submitLabel}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
