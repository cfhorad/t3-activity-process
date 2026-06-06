import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
	assertCanManageArea,
	createTRPCRouter,
	managerProcedure,
} from "~/server/api/trpc";
import { area, user, userAreas } from "~/server/db/schema";

export const adminRouter = createTRPCRouter({
	// Get pending approvals for regions the manager belongs to
	getPendingApprovals: managerProcedure.query(async ({ ctx }) => {
		const { areaIds } = ctx.session.user;

		const where = areaIds.includes("ALL")
			? eq(userAreas.status, "pending")
			: and(
					eq(userAreas.status, "pending"),
					inArray(userAreas.areaId, areaIds),
				);

		const list = await ctx.db.query.userAreas.findMany({
			where,
			with: {
				user: true,
				area: true,
			},
			orderBy: (ua, { desc }) => [desc(ua.approvedAt)],
		});

		// Exclude users whose account status is suspended and sort by user.name
		return list
			.filter((ua) => ua.user?.status !== "suspended")
			.sort((a, b) => {
				const nameA = a.user?.name ?? "";
				const nameB = b.user?.name ?? "";
				return nameA.localeCompare(nameB, "zh-Hant");
			});
	}),

	// Approve an area application
	approveAreaApplication: managerProcedure
		.input(
			z.object({
				userId: z.string(),
				areaId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanManageArea(ctx.session.user.areaIds, input.areaId);

			await ctx.db.transaction(async (tx) => {
				// 1. Update userArea status to approved
				await tx
					.update(userAreas)
					.set({
						status: "approved",
						approvedById: ctx.session.user.id,
						approvedAt: new Date(),
					})
					.where(
						and(
							eq(userAreas.userId, input.userId),
							eq(userAreas.areaId, input.areaId),
						),
					);

				// 2. Fetch the user's current status
				const targetUser = await tx.query.user.findFirst({
					where: eq(user.id, input.userId),
				});

				if (!targetUser) throw new TRPCError({ code: "NOT_FOUND" });

				// 3. If global status is 'pending', change it to 'active' now that one area is approved
				// Also assign the default "VIEWER" role if they don't have one yet
				const updates: Partial<typeof user.$inferSelect> = {};
				if (targetUser.status === "pending") {
					updates.status = "active";
				}
				if (!targetUser.role) {
					updates.role = "VIEWER";
				}

				if (Object.keys(updates).length > 0) {
					await tx.update(user).set(updates).where(eq(user.id, input.userId));
				}
			});

			return { success: true };
		}),

	// Reject an area application
	rejectAreaApplication: managerProcedure
		.input(
			z.object({
				userId: z.string(),
				areaId: z.string(),
				rejectedReason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanManageArea(ctx.session.user.areaIds, input.areaId);

			await ctx.db.transaction(async (tx) => {
				// 1. Reject the area application
				await tx
					.update(userAreas)
					.set({
						status: "rejected",
						approvedById: ctx.session.user.id,
						approvedAt: new Date(),
						rejectedReason: input.rejectedReason ?? null,
					})
					.where(
						and(
							eq(userAreas.userId, input.userId),
							eq(userAreas.areaId, input.areaId),
						),
					);

				// 2. Fetch the target user with all their area applications
				const targetUser = await tx.query.user.findFirst({
					where: eq(user.id, input.userId),
					with: { areas: true },
				});

				// 3. If the user is currently active but now has zero approved areas, downgrade global status to pending
				if (targetUser && targetUser.status === "active") {
					const approvedCount = targetUser.areas.filter(
						(ua) => ua.status === "approved",
					).length;

					if (approvedCount === 0) {
						await tx
							.update(user)
							.set({ status: "pending" })
							.where(eq(user.id, input.userId));
					}
				}
			});

			return { success: true };
		}),

	// Get users with their area relationships (sorted by name)
	getUsers: managerProcedure.query(async ({ ctx }) => {
		const { areaIds } = ctx.session.user;

		const usersWithAreas = await ctx.db.query.user.findMany({
			with: {
				areas: {
					with: {
						area: true,
					},
				},
			},
		});

		// Managers can only see users that are in their areas
		const filtered = areaIds.includes("ALL")
			? usersWithAreas
			: usersWithAreas.filter((u) =>
					u.areas.some((ua) => areaIds.includes(ua.areaId)),
				);

		// Sort by name alphabetically
		return filtered.sort((a, b) => {
			const nameA = a.name ?? "";
			const nameB = b.name ?? "";
			return nameA.localeCompare(nameB, "zh-Hant");
		});
	}),

	// Update user role, status, and approved areas (ADMIN/MANAGER can adjust users in their scope)
	updateUserRoleAndAreas: managerProcedure
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(["ADMIN", "MANAGER", "VIEWER"]),
				status: z.enum(["pending", "active", "suspended"]),
				areaIds: z.array(z.string()), // the new explicit approved areas
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const approverAreaIds = ctx.session.user.areaIds;
			const isSuperAdmin = approverAreaIds.includes("ALL");

			// Check if the current manager is allowed to manage this user
			const targetUser = await ctx.db.query.user.findFirst({
				where: eq(user.id, input.userId),
				with: { areas: true },
			});

			if (!targetUser) throw new TRPCError({ code: "NOT_FOUND" });

			// Verify authority: must belong to at least one area that is in common
			if (!isSuperAdmin) {
				const hasCommonArea = targetUser.areas.some((ua) =>
					approverAreaIds.includes(ua.areaId),
				);
				if (!hasCommonArea) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "您沒有權限管理此使用者（不在您的管轄分會內）。",
					});
				}

				// Managers cannot assign roles higher than their own, and cannot change areas outside their own scope
				if (input.role === "ADMIN") {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "非超級管理員無法將角色賦予為 ADMIN。",
					});
				}
			}

			// 1. Resolve global status: Cannot be active with zero approved areas! Fall back to pending
			let resolvedStatus = input.status;
			if (input.status === "active" && input.areaIds.length === 0) {
				resolvedStatus = "pending";
			}

			await ctx.db.transaction(async (tx) => {
				// 2. Update role and status
				await tx
					.update(user)
					.set({
						role: input.role,
						status: resolvedStatus,
					})
					.where(eq(user.id, input.userId));

				// 3. Sync areas: delete relations no longer in the list (only those that were previously approved)
				const areasToDelete = targetUser.areas
					.filter((a) => a.status === "approved")
					.map((a) => a.areaId)
					.filter((id) => !input.areaIds.includes(id))
					.filter((id) => isSuperAdmin || approverAreaIds.includes(id));

				if (areasToDelete.length > 0) {
					await tx
						.delete(userAreas)
						.where(
							and(
								eq(userAreas.userId, input.userId),
								inArray(userAreas.areaId, areasToDelete),
							),
						);
				}

				// 4. Upsert newly selected areas under control
				const areasToAdd = input.areaIds.filter(
					(id) => isSuperAdmin || approverAreaIds.includes(id),
				);

				const targetAreaStatus =
					resolvedStatus === "pending"
						? ("pending" as const)
						: ("approved" as const);

				if (areasToAdd.length > 0) {
					await tx
						.insert(userAreas)
						.values(
							areasToAdd.map((areaId) => ({
								userId: input.userId,
								areaId,
								status: targetAreaStatus,
								approvedById:
									targetAreaStatus === "approved" ? ctx.session.user.id : null,
								approvedAt: targetAreaStatus === "approved" ? new Date() : null,
							})),
						)
						.onConflictDoUpdate({
							target: [userAreas.userId, userAreas.areaId],
							set: {
								status: targetAreaStatus,
								approvedById:
									targetAreaStatus === "approved" ? ctx.session.user.id : null,
								approvedAt: targetAreaStatus === "approved" ? new Date() : null,
							},
						});
				}

				// 5. Force all areas to pending if global status was resolved to pending
				if (resolvedStatus === "pending") {
					await tx
						.update(userAreas)
						.set({
							status: "pending",
							approvedById: null,
							approvedAt: null,
						})
						.where(eq(userAreas.userId, input.userId));
				}

				// 6. Delete all pending area applications if global status was resolved to suspended
				if (resolvedStatus === "suspended") {
					await tx
						.delete(userAreas)
						.where(
							and(
								eq(userAreas.userId, input.userId),
								eq(userAreas.status, "pending"),
							),
						);
				}
			});

			return { success: true };
		}),

	// CRUD Areas: Get all areas (managerProcedure can view)
	getAreas: managerProcedure.query(async ({ ctx }) => {
		return await ctx.db.query.area.findMany();
	}),

	// CRUD Areas: Create new area (restricted to superadmin 'ALL' areaIds)
	createArea: managerProcedure
		.input(
			z.object({
				id: z.string().min(1),
				name: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session.user.areaIds.includes("ALL")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "僅超級管理員可建立新分會",
				});
			}

			const [newArea] = await ctx.db
				.insert(area)
				.values({
					id: input.id.toUpperCase(),
					name: input.name,
				})
				.returning();

			if (newArea) {
				revalidateTag("public-areas");
			}

			return newArea;
		}),

	// CRUD Areas: Delete area (restricted to superadmin 'ALL' areaIds)
	deleteArea: managerProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session.user.areaIds.includes("ALL")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "僅超級管理員可刪除分會",
				});
			}

			if (input.id === "ALL") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "無法刪除系統預設的全區屬性",
				});
			}

			await ctx.db.delete(area).where(eq(area.id, input.id));
			revalidateTag("public-areas");
			return { success: true };
		}),
});
