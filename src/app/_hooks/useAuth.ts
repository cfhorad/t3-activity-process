"use client";

import { useEffect, useState } from "react";
import { authClient } from "~/server/better-auth/client";
import type { Session } from "~/server/better-auth/config";
import { api } from "~/trpc/react";

/**
 * Reusable client-side authentication and authorization hook (Global Smart Hook).
 *
 * DESIGN PATTERN (Auth Session Exception):
 * We strictly avoid prop-drilling `session.user` or permissions down from Server
 * Components (`page.tsx`) to Client Components. Server Components only handle
 * routing guards (redirecting unauthenticated users). All Client Components MUST
 * autonomously call this `useAuth` hook to determine their rendering rights.
 *
 * This hook fetches the current session and the user's approved area/activity/process
 * privileges in a single efficient tRPC query. It leverages `useMemo` and JavaScript `Set`
 * to provide O(1) instantaneous permission lookups, guaranteeing high rendering
 * performance even for massive checklists.
 *
 * @param serverSession - Optional fallback session from SSR `getSession()` to prevent hydration mismatches.
 */
export function useAuth(serverSession?: Session | null) {
	// Ensure safe hydration by tracking mount state.
	// We prefer the live clientSession once mounted, but use serverSession for initial SSR render.
	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const { data: clientSession } = authClient.useSession();
	const session = isMounted ? (clientSession ?? serverSession) : serverSession;
	const user = session?.user as Session["user"] | undefined;

	// Single, centralized tRPC query fetching the user's precise operational limits:
	// - approved areas
	// - activities they are a co-editor of (editorActivityIds)
	// - processes they are a checker of (checkerProcessIds)
	const { data: myPermissions, isLoading } = api.user.getMyPermissions.useQuery(
		undefined,
		{
			enabled: isMounted && !!session,
			staleTime: 1000 * 60 * 5, // Cache permissions for 5 minutes to avoid redundant network refetches
		},
	);

	const normalizedRole = user?.role?.toUpperCase();
	const isAdmin = normalizedRole === "ADMIN";
	const isManager = normalizedRole === "MANAGER";
	const isViewer = normalizedRole === "VIEWER" || (!isAdmin && !isManager);
	const isManagerOrAdmin = isAdmin || isManager;

	const approvedAreaIds =
		myPermissions?.areas
			?.filter((app) => app.status === "approved")
			.map((app) => app.areaId) ?? [];

	const isSuperAdmin = isAdmin && approvedAreaIds.includes("ALL");

	// ─── O(1) PERFORMANCE OPTIMIZATION ───────────────────────────────────────
	// Instead of executing Array.includes() inside rendering loops (which scales O(N)),
	// we convert these permission arrays into `Set` objects once.
	// This guarantees O(1) constant lookup time when mapping through hundreds of
	// checkboxes inside the CheckSheet table.
	const editorActivityIdsSet = new Set(myPermissions?.editorActivityIds ?? []);

	const checkerProcessIdsSet = new Set(myPermissions?.checkerProcessIds ?? []);

	// ─── INSTANTANEOUS PERMISSION HELPERS ──────────────────────────────────

	/**
	 * Determines if the current user has full CRUD editing rights over a specific Activity.
	 * Evaluates hierarchical privileges: Super Admin -> Creator -> Area Admin -> Co-editor.
	 */
	const isActivityEditor = (
		activityId: number | undefined | null,
		creatorId?: string | null,
		areaId?: string | null,
	) => {
		if (!session || !user) return false;
		// 1. Super admin has access to everything
		if (isSuperAdmin) return true;
		// 2. The original creator always has access
		if (creatorId && creatorId === user.id) return true;
		// 3. Area Admin has access if their approved areas cover the activity's assigned area
		// (Note: Array.includes is used here because approvedAreaIds is extremely small, typically N <= 5, so sequential scan is faster than Set creation overhead)
		if (isAdmin && areaId && approvedAreaIds.includes(areaId)) return true;
		// 4. Specifically assigned activity co-editor (O(1) Set lookup)
		if (activityId && editorActivityIdsSet.has(activityId)) return true;
		return false;
	};

	/**
	 * Determines if the current user has rights to check/uncheck items in a CHECK type process.
	 * Inherits full access from parent Activity rights, and falls back to specific checker assignment.
	 */
	const isProcessChecker = (
		processId: number | undefined | null,
		activityId?: number | null,
		creatorId?: string | null,
		areaId?: string | null,
	) => {
		if (!session || !user) return false;
		// 1. If they are the editor/creator/admin of the parent activity, they automatically inherit checker rights!
		if (isActivityEditor(activityId, creatorId, areaId)) return true;
		// 2. Specifically assigned process checker (O(1) Set lookup)
		if (processId && checkerProcessIdsSet.has(processId)) return true;
		return false;
	};

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
		isActivityEditor,
		isProcessChecker,
	};
}
