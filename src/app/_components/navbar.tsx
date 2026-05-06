"use client";

import {
	ArrowRightFromSquare,
	Bell,
	ChevronDown,
	Comment,
	Gear,
	Magnifier,
	Person,
	Plus,
	ShieldCheck,
} from "@gravity-ui/icons";
import { Avatar, Button, Dropdown, Label, Separator } from "@heroui/react";
import { Navbar } from "@heroui-pro/react";
import { useState } from "react";

const BrandLogo = ({ className }: { className?: string }) => (
	<svg
		aria-hidden="true"
		className={className}
		fill="none"
		viewBox="0 0 24 34"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M0 8.22973V18.0896C0 18.5557 0.239547 18.9887 0.633655 19.2352L7.35585 23.4389C8.25167 23.9991 9.41193 23.3527 9.41193 22.2934V14.0053C9.41193 13.5285 9.66262 13.0871 10.0714 12.844L14.1719 10.4064V31.6481C14.1719 32.7039 15.3252 33.3509 16.2213 32.7979L23.1595 28.5156C23.5574 28.27 23.7998 27.8347 23.7998 27.3659V6.96774C23.7998 5.91715 22.6566 5.26934 21.7603 5.81202L14.1719 10.4064V1.35182C14.1719 0.304069 13.0342 -0.34416 12.1378 0.192813L0.65562 7.07073C0.249018 7.31429 0 7.7545 0 8.22973Z"
			fill="currentColor"
		/>
	</svg>
);

const teams = [
	{ id: "heroui", logo: <BrandLogo className="size-5" />, name: "HeroUI" },
	{
		id: "acme-studio",
		logo: (
			<Avatar className="size-5" color="accent" variant="soft">
				<Avatar.Fallback className="text-[10px]">AS</Avatar.Fallback>
			</Avatar>
		),
		name: "Acme Studio",
	},
	{
		id: "moonshot",
		logo: (
			<Avatar className="size-5" color="warning" variant="soft">
				<Avatar.Fallback className="text-[10px]">MS</Avatar.Fallback>
			</Avatar>
		),
		name: "Moonshot Inc.",
	},
];

const navItems = [
	{ href: "#dashboard", label: "儀表板" },
	{ href: "#projects", label: "專案" },
	{ href: "#members", label: "成員" },
	{ href: "#billing", label: "帳單" },
];

import { authClient } from "~/server/better-auth/client";
import type { Session } from "~/server/better-auth/config";

export function NavbarComponent({
	session: serverSession,
}: {
	session?: Session | null;
}) {
	const { data: clientSession } = authClient.useSession();
	const session = clientSession ?? serverSession;
	const [activeTeam, setActiveTeam] = useState("heroui");

	if (!session) {
		return null;
	}

	const team = teams.find((t) => t.id === activeTeam) ?? teams[0];

	return (
		<div className="w-full overflow-hidden rounded-xl border border-border">
			<Navbar position="static" shouldBlockScroll={false}>
				<Navbar.Header>
					<Navbar.MenuToggle className="md:hidden" />

					<Dropdown>
						<Button className="gap-1.5 px-2" variant="ghost">
							{team?.logo}
							<span className="font-semibold text-sm">{team?.name}</span>
							<ChevronDown className="size-3.5 text-muted" />
						</Button>
						<Dropdown.Popover className="min-w-[220px]">
							<Dropdown.Menu
								onAction={(key) => {
									if (key !== "team-settings" && key !== "new-workspace") {
										setActiveTeam(String(key));
									}
								}}
							>
								<Dropdown.Item id="team-settings" textValue="團隊設定">
									<Gear className="size-4 text-muted" />
									<Label>團隊設定</Label>
								</Dropdown.Item>
								<Separator />
								{teams.map((t) => (
									<Dropdown.Item id={t.id} key={t.id} textValue={t.name}>
										{t.logo}
										<Label>{t.name}</Label>
									</Dropdown.Item>
								))}
								<Separator />
								<Dropdown.Item id="new-workspace" textValue="建立工作區">
									<Plus className="size-4 text-muted" />
									<Label>建立工作區…</Label>
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>

					<Navbar.Separator className="hidden h-4 md:block" />

					<Navbar.Content className="hidden md:flex">
						{navItems.map((item) => (
							<Navbar.Item
								href={item.href}
								isCurrent={item.href === "#dashboard"}
								key={item.href}
							>
								{item.label}
							</Navbar.Item>
						))}
					</Navbar.Content>

					<Navbar.Spacer />

					<Navbar.Content className="hidden md:flex">
						<Navbar.Item>
							<Magnifier data-slot="icon" />
						</Navbar.Item>
						<Navbar.Item>
							<Bell data-slot="icon" />
						</Navbar.Item>
					</Navbar.Content>

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
								<Dropdown.Item id="account" textValue="您的帳戶">
									<Person className="size-4 text-muted" />
									<Label>您的帳戶</Label>
								</Dropdown.Item>
								<Dropdown.Item id="preferences" textValue="偏好設定">
									<Gear className="size-4 text-muted" />
									<Label>偏好設定</Label>
								</Dropdown.Item>
								<Separator />
								<Dropdown.Item id="security" textValue="安全與隱私">
									<ShieldCheck className="size-4 text-muted" />
									<Label>安全與隱私</Label>
								</Dropdown.Item>
								<Dropdown.Item id="feedback" textValue="傳送回饋">
									<Comment className="size-4 text-muted" />
									<Label>傳送回饋</Label>
								</Dropdown.Item>
								<Separator />
								<Dropdown.Item
									id="sign-out"
									onAction={async () => {
										await authClient.signOut({
											fetchOptions: {
												onSuccess: () => {
													window.location.href = "/sign-in";
												},
											},
										});
									}}
									textValue="登出"
								>
									<ArrowRightFromSquare className="size-4 text-muted" />
									<Label>登出</Label>
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</Navbar.Header>

				<Navbar.Menu>
					{navItems.map((item) => (
						<Navbar.MenuItem
							href={item.href}
							isCurrent={item.href === "#dashboard"}
							key={item.href}
						>
							{item.label}
						</Navbar.MenuItem>
					))}
				</Navbar.Menu>
			</Navbar>
		</div>
	);
}
