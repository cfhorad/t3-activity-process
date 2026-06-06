"use client";

import {
	Button,
	Chip,
	Form,
	Label,
	ListBox,
	Select,
	Spinner,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { createAuthClient } from "better-auth/react";
import { Controller, useForm } from "react-hook-form";
import { api } from "~/trpc/react";
import { ControlledTextField } from "../controlled-text-field";
import { type RegisterValues, registerSchema } from "./auth-schemas";

interface RegisterFormProps {
	authClient: ReturnType<typeof createAuthClient>;
	onSuccess?: () => void;
	setIsLoading: (loading: boolean) => void;
	isLoading: boolean;
	setErrorMessage: (msg: string | null) => void;
}

export function RegisterForm({
	authClient,
	onSuccess,
	setIsLoading,
	isLoading,
	setErrorMessage,
}: RegisterFormProps) {
	// Fetch public list of areas for selection
	const { data: publicAreas, isLoading: isAreasLoading } =
		api.user.getPublicAreas.useQuery();

	const applyMutation = api.user.applyToAreas.useMutation();

	const registerForm = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		mode: "onChange",
		defaultValues: { name: "", email: "", password: "", areaIds: [] },
	});

	const handleError = (ctx: { error: { code?: string; message?: string } }) => {
		if (ctx.error.code === "PASSWORD_TOO_SHORT") {
			registerForm.setError("password", {
				message: "密碼太短 (至少 8 個字元)",
			});
			return;
		}

		const errorMap: Record<string, string> = {
			INVALID_EMAIL_OR_PASSWORD: "電子郵件或密碼不正確",
			INVALID_EMAIL: "無效的電子郵件格式",
			EMAIL_NOT_VERIFIED: "電子郵件尚未驗證",
			USER_ALREADY_EXISTS: "此電子郵件已被註冊",
		};
		setErrorMessage(
			errorMap[ctx.error.code ?? ""] ?? ctx.error.message ?? "發生未知錯誤",
		);
	};

	const onRegisterSubmit = async (data: RegisterValues) => {
		setErrorMessage(null);
		setIsLoading(true);
		try {
			await authClient.signUp.email({
				name: data.name,
				email: data.email,
				password: data.password,
				fetchOptions: {
					onSuccess: async () => {
						try {
							// Apply to the selected areas immediately on success
							await applyMutation.mutateAsync({
								areaIds: data.areaIds,
							});
							onSuccess?.();
						} catch (error) {
							console.error(error);
							setErrorMessage("註冊成功，但送出分會申請時失敗，請至狀態頁重試");
						}
					},
					onError: handleError,
				},
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Form
			className="flex flex-col gap-4"
			onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
		>
			<ControlledTextField
				autoComplete="name"
				autoFocus
				control={registerForm.control}
				label="姓名"
				name="name"
				type="text"
			/>

			<ControlledTextField
				autoComplete="email"
				control={registerForm.control}
				label="電子郵件地址"
				name="email"
				type="email"
			/>

			<ControlledTextField
				autoComplete="new-password"
				control={registerForm.control}
				label="密碼"
				name="password"
				placeholder="密碼 (至少 8 個字元)"
				type="password"
			/>

			<div className="flex flex-col gap-1.5">
				{isAreasLoading ? (
					<div className="flex items-center gap-2 rounded-xl border border-separator bg-surface-secondary p-3 text-muted text-xs">
						<Spinner size="sm" />
						載入分會中...
					</div>
				) : (
					<Controller
						control={registerForm.control}
						name="areaIds"
						render={({ field, fieldState }) => (
							<div className="flex flex-col gap-1">
								<Select
									isInvalid={!!fieldState.error}
									isRequired
									onChange={field.onChange}
									placeholder="選擇所屬分會"
									selectionMode="multiple"
									value={field.value}
									variant="secondary"
								>
									<Label>所屬分會 (可複選)</Label>
									<Select.Trigger>
										<Select.Value>
											{({ state }) => {
												if (state.selectedItems.length === 0) {
													return "選擇所屬分會";
												}
												return (
													<div className="flex flex-wrap gap-1">
														{state.selectedItems.map((item) => (
															<Chip
																className="font-semibold"
																color="accent"
																key={item.key}
																size="sm"
																variant="soft"
															>
																{item.textValue}
															</Chip>
														))}
													</div>
												);
											}}
										</Select.Value>
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox selectionMode="multiple">
											{(publicAreas ?? []).map((area) => (
												<ListBox.Item
													id={area.id}
													key={area.id}
													textValue={area.name}
												>
													<div className="flex items-center justify-between">
														<span className="font-medium text-sm">
															{area.name}
														</span>
													</div>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
								{fieldState.error && (
									<p className="text-danger text-xs">
										{fieldState.error.message}
									</p>
								)}
							</div>
						)}
					/>
				)}
			</div>

			<Button
				className="mt-2 font-medium"
				fullWidth
				isDisabled={!registerForm.formState.isValid || isLoading}
				isPending={isLoading}
				type="submit"
			>
				{isLoading && <Spinner color="current" size="sm" />}
				註冊
			</Button>
		</Form>
	);
}
