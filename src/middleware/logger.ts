import type { MiddlewareHandler } from "hono"
import type { AppContext } from "../core/types"
import { createLogger } from "../lib/logger"

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: Headers): Record<string, string> {
	const sanitized: Record<string, string> = {}
	const sensitiveHeaders = ["auth", "cookie", "api-key", "token", "secret", "session", "bearer"]

	for (const [key, value] of headers.entries()) {
		if (sensitiveHeaders.some((h) => key.toLowerCase().includes(h))) {
			sanitized[key] = "[REDACTED]"
		} else {
			sanitized[key] = value
		}
	}

	return sanitized
}

/**
 * Request/response logging middleware
 * Logs incoming requests and outgoing responses with timing information
 */
export const loggerMiddleware = (): MiddlewareHandler<{
	Bindings: AppContext["env"]
	Variables: AppContext["var"]
}> => {
	return async (c, next) => {
		const logger = createLogger(c)
		const startTime = c.get("requestStartTime")

		// Log incoming request
		logger.info("Incoming request", {
			method: c.req.method,
			path: c.req.path,
			headers: sanitizeHeaders(c.req.raw.headers),
		})

		// Continue with request
		await next()

		// Calculate duration
		const duration = performance.now() - startTime

		// Get response info
		const status = c.res.status

		// Log outgoing response
		logger.info("Outgoing response", {
			method: c.req.method,
			path: c.req.path,
			status,
			duration: `${duration.toFixed(2)}ms`,
		})
	}
}
