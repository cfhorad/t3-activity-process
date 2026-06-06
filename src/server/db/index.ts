import { Pool } from "@neondatabase/serverless";
import {
	drizzle as drizzleServerless,
	type NeonDatabase,
} from "drizzle-orm/neon-serverless";
import {
	drizzle as drizzlePg,
	type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
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
		// Production (Serverless/Edge): WebSocket/Pool driver
		// Allows transactions and connection pooling
		// Fallback to a placeholder string at build-time if environment variables are not fully loaded in the build environment
		const databaseUrl =
			env.DATABASE_URL || "postgresql://placeholder-for-build-time.local/db";
		const pool = new Pool({ connectionString: databaseUrl });
		return drizzleServerless({ client: pool, schema });
	}

	// Development: Stateful connection with Singleton pattern
	// Prevents "too many connections" during HMR
	const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
	globalForDb.conn = conn;

	return drizzlePg({ client: conn, schema });
};

// Cast to intersection type to solve TS Union & nominal peer dependency conflicts
export const db = createDb() as unknown as PostgresJsDatabase<typeof schema> &
	NeonDatabase<typeof schema>;
