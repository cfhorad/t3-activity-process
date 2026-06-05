import "dotenv/config";
import { db } from "~/server/db";
import { area } from "~/server/db/schema";

async function seed() {
	await db
		.insert(area)
		.values([
			{ id: "ALL", name: "全區（所有分會）" },
			{ id: "NORTH", name: "北區" },
			{ id: "CENTRAL", name: "中區" },
			{ id: "SOUTH", name: "南區" },
			{ id: "EAST", name: "東區" },
			{ id: "ISLAND", name: "離島" },
		])
		.onConflictDoNothing();

	console.log("✅ Seeded 6 areas");
}

seed().catch(console.error);
