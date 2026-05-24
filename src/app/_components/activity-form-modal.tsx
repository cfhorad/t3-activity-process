import {
	Autocomplete,
	Button,
	EmptyState,
	Form,
	Input,
	Label,
	ListBox,
	Modal,
	SearchField,
	Select,
	Tag,
	TagGroup,
	TextField,
	useFilter,
} from "@heroui/react";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";

import { ControlledTextField } from "~/app/_components/controlled-text-field";
import { useAuth } from "~/app/_hooks/useAuth";
import { api } from "~/trpc/react";

import { useActivityForm } from "../_hooks/useActivityForm";
import type { ActivityFormData } from "./activity-form-schema";

interface ActivityFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: ActivityFormData) => void;
	isPending: boolean;
	initialData?: Partial<ActivityFormData>;
	title: string;
	description?: string;
	submitLabel: string;
	mode: "create" | "edit";
}

export function ActivityFormModal({
	isOpen,
	onClose,
	onOpenChange,
	onSubmit,
	isPending,
	initialData,
	title,
	description,
	submitLabel,
	mode,
}: ActivityFormModalProps) {
	const {
		form,
		spreadsheetInput,
		setSpreadsheetInput,
		handleSubmit,
		isSubmittable,
	} = useActivityForm({
		initialData,
		onSubmit,
		isOpen,
	});

	const { data: areasList } = api.admin.getAreas.useQuery(undefined, {
		enabled: isOpen,
	});

	const { data: usersList } = api.admin.getUsers.useQuery(undefined, {
		enabled: isOpen,
	});

	const { user, isSuperAdmin, approvedAreaIds: userAreaIds } = useAuth();
	const { contains } = useFilter({ sensitivity: "base" });

	// Filter available areas for this user
	const availableAreas = useMemo(() => {
		if (!areasList) return [];
		if (isSuperAdmin) return areasList;
		return areasList.filter((area) => userAreaIds.includes(area.id));
	}, [areasList, isSuperAdmin, userAreaIds]);

	const selectedAreaId = form.watch("areaId");

	// Filter users to only those approved in the selected activity area and having active global status
	const filteredUsersList = useMemo(() => {
		if (!usersList || !selectedAreaId) return [];
		return usersList.filter(
			(u) =>
				u.status === "active" &&
				u.areas.some(
					(ua) => ua.areaId === selectedAreaId && ua.status === "approved",
				),
		);
	}, [usersList, selectedAreaId]);

	// Keep editorUserIds valid and clean when areaId changes
	useEffect(() => {
		if (!selectedAreaId) {
			form.setValue("editorUserIds", []);
			return;
		}

		const currentEditors = form.getValues("editorUserIds") || [];
		if (currentEditors.length === 0 || !usersList) return;

		// Filter out co-editors that do not belong / are not approved in the new selectedAreaId
		const validEditors = currentEditors.filter((editorId) => {
			const u = usersList.find((usr) => usr.id === editorId);
			return u?.areas.some(
				(ua) => ua.areaId === selectedAreaId && ua.status === "approved",
			);
		});

		if (validEditors.length !== currentEditors.length) {
			form.setValue("editorUserIds", validEditors);
		}
	}, [selectedAreaId, usersList, form]);

	return (
		<Modal.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open && mode === "create") {
					setSpreadsheetInput("");
					form.reset();
				}
			}}
		>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-primary/10 text-primary">
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
									label="活動名稱"
									name="name"
									placeholder={mode === "create" ? "例如：用餐報到" : undefined}
								/>

								<TextField isRequired name="googleSheetId" variant="secondary">
									<Label>Google 試算表 URL 或 ID</Label>
									<Input
										onChange={(e) => setSpreadsheetInput(e.target.value)}
										placeholder="在此貼上試算表 URL"
										value={spreadsheetInput}
										variant="secondary"
									/>
									{form.formState.errors.googleSheetId && (
										<p className="text-danger text-xs">
											{form.formState.errors.googleSheetId.message}
										</p>
									)}
								</TextField>

								<Controller
									control={form.control}
									name="areaId"
									render={({ field }) => (
										<Select
											className="w-full"
											isRequired
											onChange={(val) => field.onChange(val as string)}
											placeholder="選擇所屬營運分會"
											value={field.value}
										>
											<Label>活動營運分會</Label>
											<Select.Trigger>
												<Select.Value />
												<Select.Indicator />
											</Select.Trigger>
											<Select.Popover>
												<ListBox>
													{availableAreas.map((area) => (
														<ListBox.Item
															id={area.id}
															key={area.id}
															textValue={area.name}
														>
															{area.name} ({area.id})
															<ListBox.ItemIndicator />
														</ListBox.Item>
													))}
												</ListBox>
											</Select.Popover>
											{form.formState.errors.areaId && (
												<p className="mt-1 text-danger text-xs">
													{form.formState.errors.areaId.message}
												</p>
											)}
										</Select>
									)}
								/>

								<Controller
									control={form.control}
									name="editorUserIds"
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
												isDisabled={!selectedAreaId}
												onChange={(keys) => {
													if (Array.isArray(keys)) {
														field.onChange(keys.map(String));
													}
												}}
												placeholder={
													selectedAreaId
														? "選擇協同編輯者 (可輸入名稱搜尋，可複選)"
														: "請先選擇活動營運分會"
												}
												selectionMode="multiple"
												value={selectedKeys}
											>
												<Label>協同編輯者 (擁有此活動完整管理權限)</Label>
												<Autocomplete.Trigger>
													<Autocomplete.Value>
														{({ isPlaceholder, state }) => {
															if (
																isPlaceholder ||
																state.selectedItems.length === 0
															) {
																return selectedAreaId
																	? "選擇協同編輯者"
																	: "請先選擇活動營運分會";
															}
															return (
																<TagGroup onRemove={handleRemoveTags} size="sm">
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
															{filteredUsersList
																.filter((u) => u.id !== user?.id)
																.map((u) => (
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

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<ControlledTextField
										control={form.control}
										label="活動日期"
										name="activityDate"
										type="date"
									/>

									<ControlledTextField
										control={form.control}
										isRequired={false}
										label="備註"
										name="activityMemo"
										placeholder={
											mode === "create" ? "例如：年度聚餐" : undefined
										}
									/>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button onPress={onClose} variant="secondary">
								取消
							</Button>
							<Button
								isDisabled={!isSubmittable}
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
