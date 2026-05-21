"use client";

import { useEffect, useState } from "react";
import { authClient } from "~/server/better-auth/client";
import type { Session } from "~/server/better-auth/config";
import { api } from "~/trpc/react";

/**
 * Reusable client-side authentication and authorization hook.
 *
 * Fetches the current session and the user's approved areas to compute
 * roles and specific privilege states (e.g. isSuperAdmin, isManagerOrAdmin).
 *
 * Supports Next.js SSR by accepting a serverSession fallback.
 */
export function useAuth(serverSession?: Session | null) {
	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const { data: clientSession } = authClient.useSession();
	const session = isMounted ? (clientSession ?? serverSession) : serverSession;
	const user = session?.user as Session["user"] | undefined;

	const { data: myApplications, isLoading } =
		api.user.getMyAreaStatuses.useQuery(undefined, {
			enabled: isMounted && !!session,
		});

	const normalizedRole = user?.role?.toUpperCase();
	const isAdmin = normalizedRole === "ADMIN";
	const isManager = normalizedRole === "MANAGER";
	const isViewer = normalizedRole === "VIEWER" || (!isAdmin && !isManager);
	const isManagerOrAdmin = isAdmin || isManager;

	const approvedAreaIds =
		myApplications
			?.filter((app) => app.status === "approved")
			.map((app) => app.areaId) ?? [];

	const isSuperAdmin = isAdmin && approvedAreaIds.includes("ALL");

	return {
		session,
		user,
		isLoading,
		isAdmin,
		isManager,
		isViewer,
		isManagerOrAdmin,
		approvedAreaIds,
		isSuperAdmin,
	};
}
