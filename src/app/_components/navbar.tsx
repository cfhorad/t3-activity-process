"use client";

import {
	ArrowRightFromSquare,
	Clock,
	Person,
	ShieldCheck,
} from "@gravity-ui/icons";
import { Avatar, Button, Dropdown, Label, Separator } from "@heroui/react";
import { Navbar } from "@heroui-pro/react";
import { Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { useAuth } from "~/app/_hooks/useAuth";
import { authClient } from "~/server/better-auth/client";
import type { Session } from "~/server/better-auth/config";

// ─── Main Navbar Component ───
export function NavbarComponent({
	session: serverSession,
}: {
	session?: Session | null;
}) {
	const router = useRouter();
	const { isAdmin, session } = useAuth(serverSession);

	if (!session) {
		return null;
	}

	// ─── User Avatar Dropdown Items Config ───
	const avatarDropdownItems = [
		{
			id: "account",
			label: "您的帳戶",
			icon: <Person className="size-4 text-info" />,
			onAction: () => {
				router.push("/profile");
			},
		},
		isAdmin && {
			id: "admin-dashboard",
			label: "管理員後台",
			icon: <ShieldCheck className="size-4 text-success" />,
			onAction: () => {
				router.push("/admin");
			},
		},
		{
			id: "pending-approval",
			label: "審核狀態",
			icon: <Clock className="size-4 text-warning" />,
			onAction: () => {
				router.push("/pending-approval");
			},
		},
		{
			id: "sign-out",
			label: "登出",
			icon: <ArrowRightFromSquare className="size-4 text-danger" />,
			onAction: async () => {
				await authClient.signOut({
					fetchOptions: {
						onSuccess: () => {
							window.location.href = "/auth";
						},
					},
				});
			},
		},
	].filter(Boolean) as {
		id: string;
		label: string;
		icon: ReactNode;
		onAction: () => void | Promise<void>;
	}[];

	return (
		<div className="w-full overflow-hidden rounded-xl border border-border">
			<Navbar position="static" shouldBlockScroll={false}>
				<Navbar.Header className="relative w-full">
					{/* Center link (absolute centered) */}
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<Link
							className="flex items-center gap-2 text-foreground transition-colors duration-200 hover:text-primary"
							href="/"
						>
							<Home className="size-5 shrink-0" />
							<span className="hidden font-bold text-sm tracking-wide md:inline">
								活動管理
							</span>
						</Link>
					</div>

					<Navbar.Spacer />

					{/* User Avatar & Profile Dropdown Menu Trigger */}
					<Dropdown>
						<Button aria-label="User menu" isIconOnly variant="ghost">
							<Avatar className="size-7">
								<Avatar.Image
									alt={session?.user?.name ?? "User"}
									src={session?.user?.image ?? undefined}
								/>
								<Avatar.Fallback>
									{session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
								</Avatar.Fallback>
							</Avatar>
						</Button>
						<Dropdown.Popover className="min-w-[200px]" placement="bottom end">
							<Dropdown.Menu>
								{avatarDropdownItems.map((item, index) => (
									<Fragment key={item.id}>
										<Dropdown.Item
											id={item.id}
											onAction={item.onAction}
											textValue={item.label}
										>
											{item.icon}
											<Label>{item.label}</Label>
										</Dropdown.Item>
										{index < avatarDropdownItems.length - 1 && <Separator />}
									</Fragment>
								))}
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</Navbar.Header>
			</Navbar>
		</div>
	);
}
