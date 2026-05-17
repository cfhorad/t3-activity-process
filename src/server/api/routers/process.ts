import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	managerProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import { activities, processes } from "~/server/db/schema";

export const processRouter = createTRPCRouter({
	getByActivityId: protectedProcedure
		.input(z.object({ activityId: z.number() }))
		.query(async ({ ctx, input }) => {
			const { areaId } = ctx.session.user;

			// Check activity access first
			const activity = await ctx.db.query.activities.findFirst({
				where: (activities, { and, eq }) =>
					areaId === "ALL"
						? eq(activities.id, input.activityId)
						: and(
								eq(activities.id, input.activityId),
								eq(activities.areaId, areaId),
							),
			});

			if (!activity) throw new TRPCError({ code: "NOT_FOUND" });

			return await ctx.db.query.processes.findMany({
				where: eq(processes.activityId, input.activityId),
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
			const { areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.id),
				with: {
					activity: { with: { leaders: true } },
				},
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			// Check area access
			if (areaId !== "ALL" && process.activity.areaId !== areaId) {
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
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaId } = ctx.session.user;

			const activity = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, input.activityId),
			});

			if (!activity) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" && (areaId === "ALL" || activity.areaId === areaId);

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"您沒有權限在此活動下建立程序（僅限活動建立者或該區管理員）。",
				});
			}

			const [process] = await ctx.db
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
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const { id: userId, role, areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, id),
				with: { activity: true },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaId === "ALL" || process.activity.areaId === areaId);

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限編輯此程序（僅限活動建立者或該區管理員）。",
				});
			}

			const [updatedProcess] = await ctx.db
				.update(processes)
				.set(data)
				.where(eq(processes.id, id))
				.returning();
			return updatedProcess;
		}),

	delete: managerProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId, role, areaId } = ctx.session.user;

			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.id),
				with: { activity: true },
			});

			if (!process) throw new TRPCError({ code: "NOT_FOUND" });

			const isCreator = process.activity.createdById === userId;
			const isAreaAdmin =
				role === "ADMIN" &&
				(areaId === "ALL" || process.activity.areaId === areaId);

			if (!isCreator && !isAreaAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "您沒有權限刪除此程序（僅限活動建立者或該區管理員）。",
				});
			}

			await ctx.db.delete(processes).where(eq(processes.id, input.id));
			return { success: true };
		}),
});
