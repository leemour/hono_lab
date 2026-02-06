import type { Hono } from "hono"
import type { AppContext } from "../core/types"
import health from "./v1/health"

/**
 * Register all application routes
 */
export function registerRoutes(
	app: Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>
) {
	// API v1 routes
	app.route("/v1/health", health)
}
