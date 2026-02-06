import { Hono } from "hono"
import type { AppContext, HealthResponse } from "../../core/types"
import { createDatabase } from "../../lib/db"

const health = new Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>()

/**
 * Health check endpoint
 * GET /v1/health
 */
health.get("/", async (c) => {
	const response: HealthResponse = {
		status: "healthy",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
		environment: c.env.ENVIRONMENT || "development",
	}

	// Check database connection if available
	try {
		const db = await createDatabase(c.env)
		const isConnected = await db.healthCheck()
		response.database = {
			adapter: db.getAdapterType(),
			connected: isConnected,
		}
	} catch (_error) {
		// Database not configured or connection failed
		response.database = {
			adapter: "sqlite",
			connected: false,
		}
	}

	return c.json(response)
})

export default health
