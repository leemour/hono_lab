import type { MiddlewareHandler } from "hono"
import { createDatabase } from "../lib/db"
import type { AppContext } from "../core/types"
import type { IDatabase } from "../lib/db"

export type CreateDatabase = (env: AppContext["env"]) => Promise<IDatabase>

/**
 * Database middleware
 * Initializes the database connection once per request context
 * and makes it available via c.get("db")
 *
 * If database initialization fails, the request continues without a db
 * Routes can check if db is available and handle accordingly
 */
export const databaseMiddleware = (
	createDb: CreateDatabase = createDatabase
): MiddlewareHandler<{
	Bindings: AppContext["env"]
	Variables: AppContext["var"]
}> => {
	return async (c, next) => {
		// Only initialize database once per context
		if (!c.get("db")) {
			try {
				const db = await createDb(c.env)
				c.set("db", db)
			} catch (error) {
				// Database initialization failed, but don't block the request
				// Routes can check if db is available using c.get("db")
				console.warn("Database initialization failed", {
					error: error instanceof Error ? error.message : String(error),
					correlationId: c.get("correlationId"),
				})
			}
		}
		await next()
	}
}
