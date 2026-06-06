"use client";

import {
	Autocomplete,
	Button,
	EmptyState,
	FieldError,
	Form,
	Label,
	ListBox,
	Modal,
	SearchField,
	Select,
	Spinner,
	Tag,
	TagGroup,
	TextArea,
	TextField,
	useFilter,
} from "@heroui/react";
import { Pencil, Plus } from "lucide-react";

import { Controller } from "react-hook-form";
import { ControlledTextField } from "~/app/_components/controlled-text-field";
import { api } from "~/trpc/react";
import { useProcessForm } from "../_hooks/useProcessForm";
import type { ProcessFormData } from "./process-form-schema";

interface ProcessFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: ProcessFormData & { iframeSrc: string | null }) => void;
	isPending: boolean;
	activityId: number;
	initialData?: Partial<
		ProcessFormData & {
			iframeSrc?: string | null;
			checkers?: { userId: string }[];
		}
	>;
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
	const { form, handleSubmit, selectedType } = useProcessForm({
		initialData,
		onSubmit,
		isOpen,
		activityId,
	});

	const { data: activity } = api.activity.getById.useQuery(
		{ id: activityId },
		{ enabled: isOpen },
	);

	const { data: usersList } = api.admin.getUsers.useQuery(undefined, {
		enabled: isOpen,
	});

	const { contains } = useFilter({ sensitivity: "base" });

	const filteredUsersList = (() => {
		if (!usersList || !activity?.areaId) return [];
		return usersList.filter(
			(u) =>
				u.status === "active" &&
				u.areas.some(
					(ua) => ua.areaId === activity.areaId && ua.status === "approved",
				),
		);
	})();

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

								{selectedType !== "WEB" && (
									<ControlledTextField
										control={form.control}
										label="發布到網路的 CSV 網址"
										name="sheetName"
										placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv"
									/>
								)}

								{selectedType === "CHECK" && (
									<Controller
										control={form.control}
										name="checkerUserIds"
										render={({ field }) => {
											const selectedKeys = field.value || [];
											const handleRemoveTags = (
												keysToRemove: Set<string | number>,
											) => {
												const updatedKeys = selectedKeys.filter(
													(key) => !keysToRemove.has(key),
												);
												field.onChange(updatedKeys);
											};

											return (
												<Autocomplete
													className="w-full"
													isDisabled={!activity?.areaId}
													onChange={(keys) => {
														if (Array.isArray(keys)) {
															field.onChange(keys.map(String));
														}
													}}
													placeholder="選擇檢核人員 (可輸入名稱搜尋，可複選)"
													selectionMode="multiple"
													value={selectedKeys}
													variant="secondary"
												>
													<Label>檢核人員 (僅可在此分頁勾選)</Label>
													<Autocomplete.Trigger>
														<Autocomplete.Value>
															{({ isPlaceholder, state }) => {
																if (
																	isPlaceholder ||
																	state.selectedItems.length === 0
																) {
																	return "選擇檢核人員";
																}
																return (
																	<TagGroup
																		onRemove={handleRemoveTags}
																		size="sm"
																	>
																		<TagGroup.List>
																			{state.selectedItems.map((item) => (
																				<Tag id={item.key} key={item.key}>
																					{item.textValue}
																				</Tag>
																			))}
																		</TagGroup.List>
																	</TagGroup>
																);
															}}
														</Autocomplete.Value>
														<Autocomplete.Indicator />
													</Autocomplete.Trigger>
													<Autocomplete.Popover>
														<Autocomplete.Filter filter={contains}>
															<SearchField
																aria-label="搜尋檢核人員"
																autoFocus
																name="search"
																variant="secondary"
															>
																<SearchField.Group>
																	<SearchField.SearchIcon />
																	<SearchField.Input placeholder="輸入名稱搜尋..." />
																	<SearchField.ClearButton />
																</SearchField.Group>
															</SearchField>
															<ListBox
																renderEmptyState={() => (
																	<EmptyState>找不到符合的使用者</EmptyState>
																)}
															>
																{filteredUsersList.map((u) => (
																	<ListBox.Item
																		id={u.id}
																		key={u.id}
																		textValue={u.name ?? u.email}
																	>
																		<div className="flex flex-col">
																			<span className="font-medium text-sm">
																				{u.name ?? "未設定姓名"}
																			</span>
																			<span className="text-[10px] text-muted">
																				{u.email}
																			</span>
																		</div>
																		<ListBox.ItemIndicator />
																	</ListBox.Item>
																))}
															</ListBox>
														</Autocomplete.Filter>
													</Autocomplete.Popover>
												</Autocomplete>
											);
										}}
									/>
								)}

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
								isDisabled={
									selectedType !== "WEB" ? !form.watch("sheetName") : false
								}
								isPending={isPending}
								type="submit"
							>
								{isPending && <Spinner color="current" size="sm" />}
								{isPending ? `${submitLabel}...` : submitLabel}
							</Button>
						</Modal.Footer>
					</Form>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
