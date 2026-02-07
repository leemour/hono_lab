import type { Bindings } from "../../core/config"
import type { IDatabase } from "./interface"

/**
 * Database factory for Cloudflare Workers.
 * Only supports D1 to avoid bundling Node-only dependencies.
 */
export async function createDatabase(env: Bindings): Promise<IDatabase> {
	// Check for D1 binding (Cloudflare Workers)
	if (env.DB) {
		if (env.ENVIRONMENT === "development")
			console.log("📦 Using D1 database adapter (Cloudflare Workers)")
		const { D1Adapter } = await import("./adapters/d1")
		return new D1Adapter(env.DB)
	}

	throw new Error("D1 database binding required for Workers (DB).")
}

// Re-export types and schema
export * from "./schema"
export type { IDatabase } from "./interface"
