import { eq } from "drizzle-orm";
import {
	unstable_cacheLife as cacheLife,
	unstable_cacheTag as cacheTag,
} from "next/cache";
import { db } from "~/server/db";
import { processes } from "~/server/db/schema";

export async function getCachedProcess(id: number) {
	"use cache";
	cacheLife("days");
	cacheTag(`process-${id}`);

	const process = await db.query.processes.findFirst({
		where: eq(processes.id, id),
		with: {
			activity: { with: { editors: true } },
			checkers: { with: { user: true } },
		},
	});

	return process;
}
