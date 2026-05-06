"use client";

import { Button, Form } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { createAuthClient } from "better-auth/react";
import { useForm } from "react-hook-form";
import { type LoginValues, loginSchema } from "./auth-schemas";
import { ControlledTextField } from "./controlled-text-field";

interface LoginFormProps {
	authClient: ReturnType<typeof createAuthClient>;
	onSuccess?: () => void;
	setIsLoading: (loading: boolean) => void;
	isLoading: boolean;
	setErrorMessage: (msg: string | null) => void;
}

export function LoginForm({
	authClient,
	onSuccess,
	setIsLoading,
	isLoading,
	setErrorMessage,
}: LoginFormProps) {
	const loginForm = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		mode: "onChange",
		defaultValues: { email: "", password: "" },
	});

	const handleError = (ctx: { error: { code?: string; message?: string } }) => {
		if (ctx.error.code === "PASSWORD_TOO_SHORT") {
			loginForm.setError("password", { message: "密碼太短 (至少 8 個字元)" });
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

	const onLoginSubmit = async (data: LoginValues) => {
		setErrorMessage(null);
		setIsLoading(true);
		try {
			await authClient.signIn.email({
				email: data.email,
				password: data.password,
				fetchOptions: {
					onSuccess: () => onSuccess?.(),
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
			onSubmit={loginForm.handleSubmit(onLoginSubmit)}
		>
			<ControlledTextField
				autoComplete="email"
				autoFocus
				control={loginForm.control}
				label="電子郵件地址"
				name="email"
				type="email"
			/>

			<ControlledTextField
				autoComplete="current-password"
				control={loginForm.control}
				label="密碼"
				name="password"
				placeholder="密碼 (至少 8 個字元)"
				type="password"
			/>

			<Button
				className="mt-2 font-medium"
				fullWidth
				isDisabled={!loginForm.formState.isValid || isLoading}
				isPending={isLoading}
				type="submit"
			>
				登入
			</Button>
		</Form>
	);
}
