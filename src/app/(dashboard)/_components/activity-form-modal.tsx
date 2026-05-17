import {
	Button,
	Form,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	TextField,
} from "@heroui/react";
import { Pencil, Plus } from "lucide-react";
import { useMemo } from "react";
import { Controller } from "react-hook-form";

import { ControlledTextField } from "~/app/_components/controlled-text-field";
import type { User } from "~/server/better-auth/config";
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
	user: User & { areaIds?: string[] };
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
	user,
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

	const role = user?.role?.toUpperCase();
	const userAreaIds = user?.areaIds ?? [];
	const isSuperAdmin = role === "ADMIN";

	// Filter available areas for this user
	const availableAreas = useMemo(() => {
		if (!areasList) return [];
		if (isSuperAdmin) return areasList;
		return areasList.filter((area) => userAreaIds.includes(area.id));
	}, [areasList, isSuperAdmin, userAreaIds]);

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
											onSelectionChange={(key) => field.onChange(key as string)}
											placeholder="選擇所屬營運分會"
											selectedKey={field.value}
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
