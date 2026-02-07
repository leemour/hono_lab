import { Hono } from "hono"
import type { AppContext } from "./core/types"
import type { Bindings } from "./core/config"
import type { CreateDatabase } from "./middleware/database"
import { NotFoundError } from "./core/errors"
import {
	correlationMiddleware,
	loggerMiddleware,
	errorHandler,
	securityHeaders,
	corsMiddleware,
	databaseMiddleware,
} from "./middleware"
import { registerRoutes } from "./routes"

/**
 * Create and configure the Hono application
 * This factory function sets up all middleware and routes
 *
 * @param bindings - Optional environment bindings (required for Node.js, optional for Workers)
 */
export function createApp(bindings?: Bindings, options?: { createDatabase?: CreateDatabase }) {
	const app = new Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>()

	// For Node.js runtime, inject bindings into every request
	if (bindings) {
		app.use("*", async (c, next) => {
			// Merge provided bindings with any runtime bindings
			c.env = { ...bindings, ...c.env }
			await next()
		})
	}

	// Set error handler
	app.onError(errorHandler)

	// Apply middleware in order
	app.use("*", correlationMiddleware())
	app.use("*", loggerMiddleware())
	app.use("*", databaseMiddleware(options?.createDatabase)) // Initialize database once per request
	app.use("*", securityHeaders())
	app.use("*", corsMiddleware())

	// Register all routes
	registerRoutes(app)

	// 404 handler - must be last
	app.notFound((c) => {
		throw new NotFoundError(`Route ${c.req.method} ${c.req.path} not found`)
	})

	return app
}
