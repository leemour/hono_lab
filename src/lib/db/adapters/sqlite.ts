import Database from "better-sqlite3"
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import * as schema from "../schema"
import type { IDatabase } from "../interface"

/**
 * SQLite adapter for local development
 * Uses better-sqlite3 for fast, synchronous SQLite operations
 */
export class SQLiteAdapter implements IDatabase {
	private db: BetterSQLite3Database<typeof schema>
	private sqlite: Database.Database

	constructor(dbPath = "./local.db") {
		this.sqlite = new Database(dbPath)
		this.db = drizzle(this.sqlite, { schema })
	}

	getDrizzle() {
		return this.db
	}

	getAdapterType(): "sqlite" {
		return "sqlite"
	}

	async healthCheck(): Promise<boolean> {
		try {
			// Simple query to check connection
			this.sqlite.prepare("SELECT 1").get()
			return true
		} catch {
			return false
		}
	}

	/**
	 * Close the database connection
	 */
	close(): void {
		this.sqlite.close()
	}
}
