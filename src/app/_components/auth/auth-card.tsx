"use client";

import { Button, Card, Separator, Spinner, Tabs } from "@heroui/react";
import type { createAuthClient } from "better-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { GoogleIcon, LockIcon } from "./auth-icons";
import { LoginForm } from "./login-form";
import { MessageDialog } from "./message-dialog";
import { RegisterForm } from "./register-form";

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
	const [isSocialLoading, setIsSocialLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSocialLogin = async (provider: "google") => {
		setIsSocialLoading(true);
		try {
			await authClient.signIn.social({ provider });
		} catch (error) {
			setErrorMessage("社群登入發生錯誤，請稍後再試。");
			console.error(error);
		} finally {
			setIsSocialLoading(false);
		}
	};

	return (
		<>
			<Card className="w-full max-w-md p-6 sm:p-8">
				<div className="flex flex-col items-center pb-6 text-center">
					<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<LockIcon className="size-6" />
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
					onSelectionChange={(k) => {
						setSelectedTab(k as string);
						setErrorMessage(null);
					}}
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

					<div className="relative overflow-hidden px-1 pt-4">
						<AnimatePresence mode="wait">
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: selectedTab === "login" ? -20 : 20 }}
								initial={{ opacity: 0, x: selectedTab === "login" ? 20 : -20 }}
								key={selectedTab}
								transition={{ duration: 0.2, ease: "easeInOut" }}
							>
								{selectedTab === "login" ? (
									<LoginForm
										authClient={authClient}
										isLoading={isLoading}
										onSuccess={onSuccess}
										setErrorMessage={setErrorMessage}
										setIsLoading={setIsLoading}
									/>
								) : (
									<RegisterForm
										authClient={authClient}
										isLoading={isLoading}
										onSuccess={onSuccess}
										setErrorMessage={setErrorMessage}
										setIsLoading={setIsLoading}
									/>
								)}
							</motion.div>
						</AnimatePresence>
					</div>
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
						isDisabled={isLoading || isSocialLoading}
						isPending={isSocialLoading}
						onPress={() => handleSocialLogin("google")}
						variant="tertiary"
					>
						{isSocialLoading ? (
							<Spinner color="current" size="sm" />
						) : (
							<GoogleIcon className="size-5" />
						)}
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
