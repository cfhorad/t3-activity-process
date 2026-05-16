import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	managerProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { processes } from "~/server/db/schema";

export const processRouter = createTRPCRouter({
	getByActivityId: publicProcedure
		.input(z.object({ activityId: z.number() }))
		.query(async ({ ctx, input }) => {
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

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const process = await ctx.db.query.processes.findFirst({
				where: eq(processes.id, input.id),
				with: {
					activity: true,
				},
			});
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
			const [process] = await ctx.db
				.update(processes)
				.set(data)
				.where(eq(processes.id, id))
				.returning();
			return process;
		}),

	delete: managerProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(processes).where(eq(processes.id, input.id));
			return { success: true };
		}),
});
