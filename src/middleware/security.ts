import { cors } from "hono/cors"
import type { MiddlewareHandler } from "hono"
import type { AppContext } from "../core/types"

/**
 * Security headers middleware
 * Sets standard security headers for all responses
 */
export const securityHeaders = (): MiddlewareHandler<{
	Bindings: AppContext["env"]
	Variables: AppContext["var"]
}> => {
	return async (c, next) => {
		await next()

		// Set security headers
		c.header("X-Content-Type-Options", "nosniff")
		c.header("X-Frame-Options", "DENY")
		c.header("X-XSS-Protection", "1; mode=block")
		c.header("Referrer-Policy", "strict-origin-when-cross-origin")
	}
}

/**
 * CORS middleware with configurable options
 */
export const corsMiddleware = (options?: {
	origin?: string | string[]
	allowMethods?: string[]
	allowHeaders?: string[]
	exposeHeaders?: string[]
	maxAge?: number
	credentials?: boolean
}) => {
	return cors({
		origin: options?.origin || "*",
		allowMethods: options?.allowMethods || ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: options?.allowHeaders || ["Content-Type", "Authorization"],
		exposeHeaders: options?.exposeHeaders || ["x-correlation-id"],
		maxAge: options?.maxAge || 86400,
		credentials: options?.credentials || true,
	})
}
