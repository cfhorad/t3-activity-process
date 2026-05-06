import "~/styles/globals.css";
import { Toast } from "@heroui/react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getSession } from "~/server/better-auth/server";
import { TRPCReactProvider } from "~/trpc/react";
import { NavbarComponent } from "./_components/navbar";

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
		<html className={`${geist.variable}`} lang="en">
			<body className="min-h-screen bg-background antialiased">
				<TRPCReactProvider>
					<Toast.Provider />
					<div className="relative flex min-h-screen flex-col">
						<NavbarComponent session={session} />
						<main className="flex-1">{children}</main>
					</div>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
