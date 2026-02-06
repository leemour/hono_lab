import postgres from "postgres"
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "../schema"
import type { IDatabase } from "../interface"

/**
 * PostgreSQL adapter for traditional deployments
 * Uses postgres.js for PostgreSQL connections
 */
export class PostgresAdapter implements IDatabase {
	private db: PostgresJsDatabase<typeof schema>
	private sql: ReturnType<typeof postgres>

	constructor(connectionString: string) {
		this.sql = postgres(connectionString)
		this.db = drizzle(this.sql, { schema })
	}

	getDrizzle() {
		return this.db
	}

	getAdapterType(): "postgres" {
		return "postgres"
	}

	async healthCheck(): Promise<boolean> {
		try {
			// Simple query to check connection
			await this.sql`SELECT 1`
			return true
		} catch {
			return false
		}
	}

	/**
	 * Close the database connection
	 */
	async close(): Promise<void> {
		await this.sql.end()
	}
}
