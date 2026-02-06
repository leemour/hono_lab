import type { Bindings } from "../../core/config"
import type { IDatabase } from "./interface"

/**
 * Database factory with intelligent adapter detection
 * Priority:
 * 1. If env.DB exists (D1 binding) → D1 adapter (Cloudflare Workers production)
 * 2. Else if env.DATABASE_URL exists → PostgreSQL adapter
 * 3. Else → SQLite adapter (local development default)
 *
 * Note: Uses dynamic imports to avoid loading adapters that aren't needed
 * This prevents issues with better-sqlite3 in Cloudflare Workers test environment
 */
export async function createDatabase(env: Bindings): Promise<IDatabase> {
	// Check for D1 binding (Cloudflare Workers)
	if (env.DB) {
		if (env.ENVIRONMENT === "development")
			console.log("📦 Using D1 database adapter (Cloudflare Workers)")
		const { D1Adapter } = await import("./adapters/d1")
		return new D1Adapter(env.DB)
	}

	// Check for PostgreSQL connection string
	if (env.DATABASE_URL) {
		if (env.ENVIRONMENT === "development") console.log("🐘 Using PostgreSQL database adapter")
		const { PostgresAdapter } = await import("./adapters/postgres")
		return new PostgresAdapter(env.DATABASE_URL)
	}

	// Default to SQLite for local development
	const dbPath = env.SQLITE_DB_PATH || "../../../db/local.db"
	if (env.ENVIRONMENT === "development") console.log(`💾 Using SQLite database adapter (${dbPath})`)
	const { SQLiteAdapter } = await import("./adapters/sqlite")
	return new SQLiteAdapter(dbPath)
}

// Re-export types and schema
export * from "./schema"
export type { IDatabase } from "./interface"
