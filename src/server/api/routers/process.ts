import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
	createTRPCRouter,
	managerProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import { activities, processCheckers, processes } from "~/server/db/schema";

export const processRouter = createTRPCRouter({
	getByActivityId: protectedProcedure
		.input(z.object({ activityId: z.number() }))
		.query(async ({ ctx, input }) => {
			const { areaIds } = ctx.session.user;

			// Check activity access first
			const activity = await ctx.db.query.activities.findFirst({
				where: (activities, { and, eq, inArray }) =>
					areaIds.includes("ALL")
						? eq(activities.id, input.activityId)
						: and(
								eq(activities.id, input.activityId),
								inArray(activities.areaId, areaIds),
							),
			});

			if (!activity) throw new TRPCError({ code: "NOT_FOUND" });

			return await ctx.db.query.processes.findMany({
				where: eq(processes.activityId, input.activityId),
				with: {
					checkers: {
						with: {
							user: true,
						},
					},
				},
				orderBy: (processes, { sql }) => [
					sql`CASE WHEN ${processes.processDate} IS NULL OR ${processes.processDate} = '' THEN 0 ELSE 1 END`,
					sql`${processes.processDate} ASC`,
					sql`CASE 
						WHEN ${processes.type} = 'WEB' THEN 1 
						WHEN ${processes.type} = 'CHECK' THEN 2 
						WHEN ${processes.type} = 'PROCESS' THEN 3 
						ELSE 4 
					END`,
				],
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const { areaIds } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.id),
				with: {
					activity: { with: { editors: true } },
					checkers: { with: { user: true } },
				},
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			// Check area access
			if (
				!areaIds.includes("ALL") &&
				!(
					process.activity.areaId !== null &&
					areaIds.includes(process.activity.areaId)
				)
			) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			return process;
		}),

	create: managerProcedure
		.input(
			z.object({
				name: z.string().min(1),
				activityId: z.number(),
				sheetName: z.string().min(1),
				type: z.enum(["PROCESS", "CHECK", "WEB"]).default("PROCESS"),
				processDate: z.string().optional().nullable(),
				processMemo: z.string().optional().nullable(),
				iframeSrc: z.string().optional().nullable(),
				checkerUserIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaIds } = ctx.session.user;

			const activity = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, input.activityId),
				with: { editors: true },
			});

			if (!activity) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(activity.areaId !== null && areaIds.includes(activity.areaId)));
			const isEditor = activity.editors.some((e) => e.userId === userId);

			if (!isCreator && !isAreaAdmin && !isEditor) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"您沒有權限在此活動下建立程序（僅限活動建立者、協同編輯者或該區管理員）。",
				});
			}

			const process = await ctx.db.transaction(async (tx) => {
				const [newProcess] = await tx
					.insert(processes)
					.values({
						name: input.name,
						activityId: input.activityId,
						sheetName: input.sheetName,
						type: input.type,
						processDate: input.processDate,
						processMemo: input.processMemo,
						iframeSrc: input.iframeSrc,
					})
					.returning();

				if (
					newProcess &&
					input.type === "CHECK" &&
					input.checkerUserIds &&
					input.checkerUserIds.length > 0
				) {
					await tx.insert(processCheckers).values(
						input.checkerUserIds.map((uId) => ({
							processId: newProcess.id,
							userId: uId,
						})),
					);
				}
				return newProcess;
			});
			return process;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1),
				sheetName: z.string().min(1),
				type: z.enum(["PROCESS", "CHECK", "WEB"]).default("PROCESS"),
				processDate: z.string().optional().nullable(),
				processMemo: z.string().optional().nullable(),
				iframeSrc: z.string().optional().nullable(),
				checkerUserIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, checkerUserIds, ...data } = input;
			const { id: userId, role, areaIds } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, id),
				with: { activity: { with: { editors: true } } },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(process.activity.areaId !== null &&
						areaIds.includes(process.activity.areaId)));
			const isEditor = process.activity.editors.some(
				(e) => e.userId === userId,
			);

			if (!isCreator && !isAreaAdmin && !isEditor) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"您沒有權限編輯此程序（僅限活動建立者、協同編輯者或該區管理員）。",
				});
			}

			const updatedProcess = await ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(processes)
					.set(data)
					.where(eq(processes.id, id))
					.returning();

				await tx
					.delete(processCheckers)
					.where(eq(processCheckers.processId, id));

				if (
					updated &&
					data.type === "CHECK" &&
					checkerUserIds &&
					checkerUserIds.length > 0
				) {
					await tx.insert(processCheckers).values(
						checkerUserIds.map((uId) => ({
							processId: id,
							userId: uId,
						})),
					);
				}
				return updated;
			});
			if (updatedProcess) {
				revalidateTag(`process-${id}`);
			}
			return updatedProcess;
		}),

	delete: managerProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaIds } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.id),
				with: { activity: { with: { editors: true } } },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaIds.includes("ALL") ||
					(process.activity.areaId !== null &&
						areaIds.includes(process.activity.areaId)));
			const isEditor = process.activity.editors.some(
				(e) => e.userId === userId,
			);

			if (!isCreator && !isAreaAdmin && !isEditor) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"您沒有權限刪除此程序（僅限活動建立者、協同編輯者或該區管理員）。",
				});
			}

			await ctx.db.delete(processes).where(eq(processes.id, input.id));
			revalidateTag(`process-${input.id}`);
			return { success: true };
		}),
});
