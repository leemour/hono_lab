import type { MiddlewareHandler } from "hono"
import type { AppContext } from "../core/types"

/**
 * Generate a UUID v4 using Web Crypto API (edge-friendly)
 */
function generateUUID(): string {
	return crypto.randomUUID()
}

/**
 * Correlation ID middleware
 * - Reads x-correlation-id from request header or generates new UUID
 * - Stores in context variables
 * - Sets x-correlation-id response header
 * - Falls back to cf-ray header if available (Cloudflare)
 */
export const correlationMiddleware = (): MiddlewareHandler<{
	Bindings: AppContext["env"]
	Variables: AppContext["var"]
}> => {
	return async (c, next) => {
		// Try to get correlation ID from request header
		const correlationId =
			c.req.header("x-correlation-id") ?? c.req.header("cf-ray") ?? generateUUID()

		// Store in context
		c.set("correlationId", correlationId)
		c.set("requestStartTime", performance.now())

		// Continue with request
		await next()

		// Set response header
		c.header("x-correlation-id", correlationId)
	}
}
