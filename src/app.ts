import { Hono } from "hono"
import type { AppContext } from "./core/types"
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
 */
export function createApp() {
	const app = new Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>()

	// Set error handler
	app.onError(errorHandler)

	// Apply middleware in order
	app.use("*", correlationMiddleware())
	app.use("*", loggerMiddleware())
	app.use("*", databaseMiddleware()) // Initialize database once per request
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
