import "~/styles/globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getSession } from "~/server/better-auth/server";
import { TRPCReactProvider } from "~/trpc/react";
import { NavbarClient } from "./_components/navbar-client";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "活動管理系統",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await getSession();

	return (
		<html className={`${geist.variable}`} lang="zh-TW" suppressHydrationWarning>
			<body className="min-h-screen bg-background antialiased">
				<TRPCReactProvider>
					<Providers>
						<div className="relative flex h-screen flex-col overflow-hidden">
							<NavbarClient session={session} />
							<main className="flex-1 overflow-auto">{children}</main>
						</div>
					</Providers>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
