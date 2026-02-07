import type { Bindings } from "../../core/config"
import type { IDatabase } from "./interface"

/**
 * Database factory for Cloudflare Workers.
 * Supports D1 binding for production Workers environments.
 * For local development with SQLite, use the SQLite adapter directly.
 */
export async function createDatabase(env: Bindings): Promise<IDatabase> {
	// Check for D1 binding (Cloudflare Workers)
	if (env.DB) {
		const { D1Adapter } = await import("./adapters/d1")
		return new D1Adapter(env.DB)
	}

	throw new Error("D1 database binding required for Workers (DB).")
}

// Re-export types and schema
export * from "./schema"
export type { IDatabase } from "./interface"
