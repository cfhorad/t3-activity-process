import { eq, inArray } from "drizzle-orm";
import {
	unstable_cacheLife as cacheLife,
	unstable_cacheTag as cacheTag,
} from "next/cache";
import { db } from "~/server/db";
import { activities } from "~/server/db/schema";

export async function getCachedActivities(areaIdsJoined: string) {
	"use cache";
	cacheLife("days");
	cacheTag("activities");

	const areaIds = areaIdsJoined.split(",");
	const where = areaIds.includes("ALL")
		? undefined
		: inArray(activities.areaId, areaIds);

	return await db.query.activities.findMany({
		where,
		with: {
			creator: true,
			processes: true,
			area: true,
			editors: {
				with: {
					user: true,
				},
			},
		},
		orderBy: (activities, { desc }) => [desc(activities.createdAt)],
	});
}

export async function getCachedActivityById(id: number) {
	"use cache";
	cacheLife("days");
	cacheTag(`activity-${id}`);

	return await db.query.activities.findFirst({
		where: eq(activities.id, id),
		with: {
			processes: true,
			creator: true,
			area: true,
			editors: {
				with: {
					user: true,
				},
			},
		},
	});
}
