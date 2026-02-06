import { sql } from "drizzle-orm"
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"
import * as schema from "../schema"
import type { IDatabase } from "../interface"

/**
 * D1 adapter for Cloudflare Workers
 * Uses Cloudflare's D1 database binding
 */
export class D1Adapter implements IDatabase {
	private db: DrizzleD1Database<typeof schema>

	constructor(d1Database: D1Database) {
		this.db = drizzle(d1Database, { schema })
	}

	getDrizzle() {
		return this.db
	}

	getAdapterType(): "d1" {
		return "d1"
	}

	async healthCheck(): Promise<boolean> {
		try {
			// Simple query to check connection
			await this.db.get(sql`SELECT 1`)
			return true
		} catch {
			return false
		}
	}
}
