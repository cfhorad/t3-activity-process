"use client";

import { Button, Form } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { createAuthClient } from "better-auth/react";
import { useForm } from "react-hook-form";
import { type RegisterValues, registerSchema } from "./auth-schemas";
import { ControlledTextField } from "./controlled-text-field";

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
	const registerForm = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		mode: "onChange",
		defaultValues: { name: "", email: "", password: "" },
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

			<Button
				className="mt-2 font-medium"
				fullWidth
				isDisabled={!registerForm.formState.isValid || isLoading}
				isPending={isLoading}
				type="submit"
			>
				註冊
			</Button>
		</Form>
	);
}
