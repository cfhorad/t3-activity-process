import { redirect } from "next/navigation";
import type React from "react";
import { getSession } from "~/server/better-auth/server";

interface AdminLayoutProps {
	children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	const { role } = session.user;
	if (role !== "ADMIN" && role !== "MANAGER") {
		// Non-administrative users are redirected back to the main dashboard
		redirect("/");
	}

	return <>{children}</>;
}
