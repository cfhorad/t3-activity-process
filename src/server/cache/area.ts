import { ne } from "drizzle-orm";
import {
	unstable_cacheLife as cacheLife,
	unstable_cacheTag as cacheTag,
} from "next/cache";
import { db } from "~/server/db";
import { area } from "~/server/db/schema";

export async function getCachedPublicAreas() {
	"use cache";
	cacheLife("days");
	cacheTag("public-areas");

	return await db.query.area.findMany({
		where: ne(area.id, "ALL"),
	});
}
