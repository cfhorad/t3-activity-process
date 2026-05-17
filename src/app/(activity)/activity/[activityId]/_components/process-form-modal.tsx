"use client";

import {
	Button,
	FieldError,
	Form,
	Label,
	ListBox,
	Modal,
	Select,
	TextArea,
	TextField,
} from "@heroui/react";
import { Pencil, Plus, Sheet } from "lucide-react";
import { Controller } from "react-hook-form";
import { ControlledTextField } from "~/app/_components/controlled-text-field";
import { useProcessForm } from "../_hooks/useProcessForm";
import type { ProcessFormData } from "./process-form-schema";

interface ProcessFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: ProcessFormData & { iframeSrc: string | null }) => void;
	isPending: boolean;
	activityId: number;
	initialData?: Partial<ProcessFormData & { iframeSrc?: string | null }>;
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
	const { form, handleSubmit, sheetNames, isLoadingSheets, selectedType } =
		useProcessForm({
			initialData,
			onSubmit,
			isOpen,
			activityId,
		});

	return (
		<Modal.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open && mode === "create") {
					form.reset();
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
								<ControlledTextField
									control={form.control}
									label="流程名稱"
									name="name"
									placeholder={mode === "create" ? "例如：總表" : undefined}
								/>

								<Controller
									control={form.control}
									name="sheetName"
									render={({ field, fieldState }) => (
										<Select
											isInvalid={!!fieldState.error}
											isRequired
											onChange={field.onChange}
											placeholder={
												isLoadingSheets ? "載入工作表中..." : "選擇工作表"
											}
											value={field.value}
											variant="secondary"
										>
											<Label>Google 試算表分頁名稱</Label>
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
											{fieldState.error && (
												<p className="mt-1 text-danger text-xs">
													{fieldState.error.message}
												</p>
											)}
										</Select>
									)}
								/>

								<Controller
									control={form.control}
									name="type"
									render={({ field }) => (
										<Select
											isRequired
											onChange={field.onChange}
											value={field.value}
											variant="secondary"
										>
											<Label>流程類型</Label>
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
									)}
								/>

								{selectedType === "WEB" && (
									<Controller
										control={form.control}
										name="iframeCode"
										render={({ field, fieldState }) => (
											<TextField
												isInvalid={!!fieldState.error}
												name={field.name}
												onBlur={field.onBlur}
												onChange={field.onChange}
												value={field.value ?? ""}
												variant="secondary"
											>
												<Label>Iframe 嵌入程式碼</Label>
												<TextArea
													placeholder='例如：<iframe src="..."></iframe>'
													rows={4}
												/>
												<FieldError>{fieldState.error?.message}</FieldError>
											</TextField>
										)}
									/>
								)}

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<ControlledTextField
										control={form.control}
										isRequired={false}
										label="執行日期"
										name="processDate"
										type="date"
									/>
								</div>
								<ControlledTextField
									control={form.control}
									isRequired={false}
									label="備註 (選填)"
									name="processMemo"
									placeholder={mode === "create" ? "新增備註..." : undefined}
								/>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button onPress={onClose} variant="secondary">
								取消
							</Button>
							<Button
								isDisabled={!form.watch("sheetName")}
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
