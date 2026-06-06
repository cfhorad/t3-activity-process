import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

const createDb = () => {
	if (env.NODE_ENV === "production") {
		// Production (Serverless/Edge): Stateless HTTP driver
		// Allows Scale-to-Zero and reduces cold starts
		// Fallback to a placeholder string at build-time if environment variables are not fully loaded in the build environment
		const databaseUrl = env.DATABASE_URL || "postgresql://placeholder-for-build-time.local/db";
		const sql = neon(databaseUrl);
		return drizzleHttp({ client: sql, schema });
	}

	// Development: Stateful connection with Singleton pattern
	// Prevents "too many connections" during HMR
	const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
	globalForDb.conn = conn;

	return drizzlePg({ client: conn, schema });
};

export const db = createDb() as unknown as PostgresJsDatabase<typeof schema> & NeonHttpDatabase<typeof schema>;

