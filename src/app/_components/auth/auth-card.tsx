"use client";

import {
	Button,
	Card,
	FieldError,
	Form,
	Input,
	Label,
	Separator,
	Tabs,
	TextField,
} from "@heroui/react";
import type { createAuthClient } from "better-auth/react";
import { useState } from "react";
import { MessageDialog } from "./message-dialog";

interface AuthCardProps {
	authClient: ReturnType<typeof createAuthClient>;
	onSuccess?: () => void;
	defaultTab?: "login" | "register";
}

export function AuthCard({
	authClient,
	onSuccess,
	defaultTab = "login",
}: AuthCardProps) {
	const [selectedTab, setSelectedTab] = useState<string>(defaultTab);

	// Shared State
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);

	// Form State
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const validateEmail = (value: string) => {
		if (!value) return null;
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			return "無效的電子郵件格式";
		}
		return null;
	};

	const validatePassword = (value: string) => {
		if (!value) return null;
		if (value.length < 8) {
			return "密碼太短 (至少 8 個字元)";
		}
		return passwordError;
	};

	const handleError = (ctx: { error: { code?: string; message?: string } }) => {
		if (ctx.error.code === "PASSWORD_TOO_SHORT") {
			setPasswordError("密碼太短 (至少 8 個字元)");
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

	const isEmailValid = email.length > 0 && validateEmail(email) === null;
	const isPasswordValid =
		password.length > 0 && validatePassword(password) === null;
	const isNameValid = name.trim().length > 0;

	const isLoginValid = isEmailValid && isPasswordValid;
	const isRegisterValid = isNameValid && isEmailValid && isPasswordValid;

	const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		setErrorMessage(null);
		setPasswordError(null);
		setIsLoading(true);
		try {
			await authClient.signIn.email({
				email,
				password,
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

	const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage(null);
		setPasswordError(null);
		setIsLoading(true);
		try {
			await authClient.signUp.email({
				name,
				email,
				password,
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
		<>
			<Card className="w-full max-w-md p-6 sm:p-8">
				<div className="flex flex-col items-center pb-6 text-center">
					<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<svg
							className="size-6"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>Lock Icon</title>
							<path
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
					<h1 className="font-semibold text-2xl text-foreground tracking-tight">
						歡迎使用安和流程管理系統
					</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						請登入或註冊以繼續
					</p>
				</div>

				<Tabs
					className="w-full"
					onSelectionChange={(k) => setSelectedTab(k as string)}
					selectedKey={selectedTab}
				>
					<Tabs.ListContainer className="w-full">
						<Tabs.List
							aria-label="Authentication Options"
							className="grid w-full grid-cols-2"
						>
							<Tabs.Tab id="login">
								登入
								<Tabs.Indicator />
							</Tabs.Tab>
							<Tabs.Tab id="register">
								註冊
								<Tabs.Indicator />
							</Tabs.Tab>
						</Tabs.List>
					</Tabs.ListContainer>

					<Tabs.Panel className="pt-4" id="login">
						<Form className="flex flex-col gap-4" onSubmit={handleSignIn}>
							<TextField
								autoComplete="email"
								fullWidth
								isRequired
								name="email"
								onChange={setEmail}
								type="email"
								validate={validateEmail}
								value={email}
								variant="secondary"
							>
								<Label>電子郵件地址</Label>
								<Input placeholder="電子郵件地址" />
								<FieldError />
							</TextField>

							<TextField
								autoComplete="current-password"
								fullWidth
								isRequired
								name="password"
								onChange={(val) => {
									setPassword(val);
									setPasswordError(null);
								}}
								type="password"
								validate={validatePassword}
								value={password}
								variant="secondary"
							>
								<Label>密碼</Label>
								<Input placeholder="密碼 (至少 8 個字元)" />
								<FieldError />
							</TextField>

							<Button
								className="mt-2 font-medium"
								fullWidth
								isDisabled={!isLoginValid || isLoading}
								isPending={isLoading}
								type="submit"
							>
								登入
							</Button>
						</Form>
					</Tabs.Panel>

					<Tabs.Panel className="pt-4" id="register">
						<Form className="flex flex-col gap-4" onSubmit={handleSignUp}>
							<TextField
								autoComplete="name"
								fullWidth
								isRequired
								name="name"
								onChange={setName}
								type="text"
								value={name}
								variant="secondary"
							>
								<Label>姓名</Label>
								<Input placeholder="姓名" />
								<FieldError />
							</TextField>

							<TextField
								autoComplete="email"
								fullWidth
								isRequired
								name="email"
								onChange={setEmail}
								type="email"
								validate={validateEmail}
								value={email}
								variant="secondary"
							>
								<Label>電子郵件地址</Label>
								<Input placeholder="電子郵件地址" />
								<FieldError />
							</TextField>

							<TextField
								autoComplete="new-password"
								fullWidth
								isRequired
								name="password"
								onChange={(val) => {
									setPassword(val);
									setPasswordError(null);
								}}
								type="password"
								validate={validatePassword}
								value={password}
								variant="secondary"
							>
								<Label>密碼</Label>
								<Input placeholder="密碼 (至少 8 個字元)" />
								<FieldError />
							</TextField>

							<Button
								className="mt-2 font-medium"
								fullWidth
								isDisabled={!isRegisterValid || isLoading}
								isPending={isLoading}
								type="submit"
							>
								註冊
							</Button>
						</Form>
					</Tabs.Panel>
				</Tabs>

				<div className="my-6 flex items-center gap-4">
					<Separator className="flex-1" />
					<span className="text-muted-foreground text-xs uppercase tracking-wider">
						或使用以下方式繼續
					</span>
					<Separator className="flex-1" />
				</div>

				<div className="flex flex-col gap-3">
					<Button
						fullWidth
						isDisabled={isLoading}
						onPress={() => authClient.signIn.social({ provider: "google" })}
						variant="tertiary"
					>
						<svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
							<title>Google Logo</title>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						使用 Google 登入
					</Button>
				</div>
			</Card>

			<MessageDialog
				isOpen={!!errorMessage}
				message={errorMessage ?? ""}
				onOpenChange={(open) => !open && setErrorMessage(null)}
				status="danger"
				title={selectedTab === "login" ? "登入失敗" : "註冊失敗"}
			/>
		</>
	);
}
