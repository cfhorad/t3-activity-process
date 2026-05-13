import "~/styles/globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getSession } from "~/server/better-auth/server";
import { TRPCReactProvider } from "~/trpc/react";
import { NavbarComponent } from "./_components/navbar";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Activity Dashboard",
	description: "Manage your activities and connected Google Sheets",
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
		<html className={`${geist.variable}`} lang="en" suppressHydrationWarning>
			<body className="min-h-screen bg-background antialiased">
				<TRPCReactProvider>
					<Providers>
						<div className="relative flex h-screen flex-col overflow-hidden">
							<NavbarComponent session={session} />
							<main className="flex-1 overflow-auto">{children}</main>
						</div>
					</Providers>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
