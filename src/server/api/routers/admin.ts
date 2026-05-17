import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
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

		return await ctx.db.query.userAreas.findMany({
			where,
			with: {
				user: true,
				area: true,
			},
			orderBy: (ua, { desc }) => [desc(ua.approvedAt)],
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
				if (targetUser.status === "pending") {
					await tx
						.update(user)
						.set({ status: "active" })
						.where(eq(user.id, input.userId));
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

			await ctx.db
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

			return { success: true };
		}),

	// Get users with their area relationships
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
		if (areaIds.includes("ALL")) {
			return usersWithAreas;
		}

		return usersWithAreas.filter((u) =>
			u.areas.some((ua) => areaIds.includes(ua.areaId)),
		);
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
						message: "您沒有權限管理此使用者（不在您的管轄地區內）。",
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

			await ctx.db.transaction(async (tx) => {
				// 1. Update role and status
				await tx
					.update(user)
					.set({
						role: input.role,
						status: input.status,
					})
					.where(eq(user.id, input.userId));

				// 2. Sync areas: delete relations no longer in the list
				if (input.areaIds.length > 0) {
					// Delete areas that are not in the new approved list under control
					const areasToDelete = targetUser.areas
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

					// 3. Upsert newly selected areas under control
					const areasToAdd = input.areaIds.filter(
						(id) => isSuperAdmin || approverAreaIds.includes(id),
					);

					if (areasToAdd.length > 0) {
						await tx
							.insert(userAreas)
							.values(
								areasToAdd.map((areaId) => ({
									userId: input.userId,
									areaId,
									status: "approved" as const,
									approvedById: ctx.session.user.id,
									approvedAt: new Date(),
								})),
							)
							.onConflictDoUpdate({
								target: [userAreas.userId, userAreas.areaId],
								set: {
									status: "approved",
									approvedById: ctx.session.user.id,
									approvedAt: new Date(),
								},
							});
					}
				} else {
					// Delete all approved relations under control
					const deleteCondition = isSuperAdmin
						? eq(userAreas.userId, input.userId)
						: and(
								eq(userAreas.userId, input.userId),
								inArray(userAreas.areaId, approverAreaIds),
							);

					await tx.delete(userAreas).where(deleteCondition);
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
					message: "僅超級管理員可建立新地區",
				});
			}

			const [newArea] = await ctx.db
				.insert(area)
				.values({
					id: input.id.toUpperCase(),
					name: input.name,
				})
				.returning();

			return newArea;
		}),

	// CRUD Areas: Delete area (restricted to superadmin 'ALL' areaIds)
	deleteArea: managerProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session.user.areaIds.includes("ALL")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "僅超級管理員可刪除地區",
				});
			}

			if (input.id === "ALL") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "無法刪除系統預設的全區屬性",
				});
			}

			await ctx.db.delete(area).where(eq(area.id, input.id));
			return { success: true };
		}),
});
