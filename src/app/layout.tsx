import "~/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { getSession } from "~/server/better-auth/server";
import { TRPCReactProvider } from "~/trpc/react";
import { api, HydrateClient } from "~/trpc/server";
import { GlobalLoader } from "./_components/global-loader";
import { NavbarClient } from "./_components/navbar-client";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "活動管理系統",
	description: "一個現代化的活動管理與報到系統，支援與 Google 試算表同步。",
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-icon.png",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "活動管理",
	},
};

export const viewport: Viewport = {
	themeColor: "#006fee",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await getSession();

	if (session) {
		// Prefetch permissions on the server to prevent client-side waterfalls
		await api.user.getMyPermissions.prefetch();
	}

	return (
		<html className={`${geist.variable}`} lang="zh-TW" suppressHydrationWarning>
			<body className="min-h-screen bg-background antialiased">
				<TRPCReactProvider>
					<HydrateClient>
						<Providers>
							<GlobalLoader />
							<div className="relative flex h-screen flex-col overflow-hidden">
								<NavbarClient session={session} />
								<main className="flex-1 overflow-auto">{children}</main>
							</div>
						</Providers>
					</HydrateClient>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
