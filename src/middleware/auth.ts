import { createMiddleware } from "hono/factory"
import type { AppContext } from "../core/types"
import { UnauthorizedError, InternalServerError } from "../core/errors"
import { verifyToken, type TokenPayload } from "../lib/auth/jwt"

type AuthEnv = {
	Bindings: AppContext["env"]
	Variables: AppContext["var"] & {
		user?: TokenPayload
	}
}

/**
 * Middleware to require JWT authentication
 * Verifies JWT from Authorization header and adds user info to context
 * @returns Hono middleware
 */
export function requireAuth() {
	return createMiddleware<AuthEnv>(async (c, next) => {
		// Get Authorization header
		const authHeader = c.req.header("Authorization")
		if (!authHeader) {
			throw new UnauthorizedError("Missing authorization header")
		}

		// Check Bearer format
		const parts = authHeader.split(" ")
		if (parts.length !== 2 || parts[0] !== "Bearer") {
			throw new UnauthorizedError("Invalid authorization header format. Expected: Bearer <token>")
		}

		const token = parts[1]

	// Get JWT secret from environment
	const secret = c.env.JWT_SECRET
	if (!secret) {
		throw new InternalServerError("JWT_SECRET not configured")
	}

		// Verify token
		try {
			const payload = await verifyToken(token, secret)
			c.set("user", payload)
		} catch (_error) {
			throw new UnauthorizedError("Invalid or expired token")
		}

		await next()
	})
}
