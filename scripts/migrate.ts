import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

/**
 * Run migrations for local SQLite database
 */
const sqlite = new Database("./db/local.db")
const db = drizzle(sqlite)

console.log("🔄 Running local SQLite migrations...")

try {
	migrate(db, { migrationsFolder: "./db/migrations" })
	console.log("✅ Migrations completed successfully")
} catch (error) {
	console.error("❌ Migration failed:", error)
	process.exit(1)
} finally {
	sqlite.close()
}
