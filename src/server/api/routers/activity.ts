import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	managerProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { activities } from "~/server/db/schema";

export const activityRouter = createTRPCRouter({
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.query.activities.findMany({
			with: {
				creator: true,
			},
			orderBy: (activities, { desc }) => [desc(activities.createdAt)],
		});
	}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const activity = await ctx.db.query.activities.findFirst({
				where: eq(activities.id, input.id),
				with: {
					processes: true,
					creator: true,
				},
			});
			return activity;
		}),

	create: managerProcedure
		.input(
			z.object({
				name: z.string().min(1),
				googleSheetId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [activity] = await ctx.db
				.insert(activities)
				.values({
					name: input.name,
					googleSheetId: input.googleSheetId,
					createdById: ctx.session.user.id,
				})
				.returning();
			return activity;
		}),


	update: managerProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1),
				googleSheetId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [activity] = await ctx.db
				.update(activities)
				.set(data)
				.where(eq(activities.id, id))
				.returning();
			return activity;
		}),

	delete: managerProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(activities).where(eq(activities.id, input.id));
			return { success: true };
		}),
});
