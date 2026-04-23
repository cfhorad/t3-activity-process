import { sql } from "drizzle-orm";
import { db } from "./src/server/db";

async function main() {
	try {
		await db.execute(sql`DROP TABLE IF EXISTS "pg-drizzle_post" CASCADE;`);
		await db.execute(
			sql`DROP TABLE IF EXISTS "pg-drizzle_google_sheet_data" CASCADE;`,
		);
		console.log("Successfully dropped tables.");
	} catch (error) {
		console.error("Error dropping table:", error);
	}
	process.exit(0);
}

main();
