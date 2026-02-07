import { Hono } from "hono"
import type { Bindings } from "../../core/config"
import type { IDatabase } from "../../lib/db"
import { ValidationError } from "../../core/errors"
import { generateToken } from "../../lib/auth/jwt"
import { requireAuth } from "../../middleware/auth"

const app = new Hono<{
	Bindings: Bindings
	Variables: {
		correlationId: string
		requestStartTime: number
		db?: IDatabase
		user?: { userId: string; role?: string }
	}
}>()

/**
 * POST /v1/auth/token
 * Generate a JWT token (for development/testing)
 */
app.post("/token", async (c) => {
	const body = await c.req.json()

	// Validate userId is present
	if (!body.userId || typeof body.userId !== "string") {
		throw new ValidationError("userId is required and must be a string")
	}

	// Get JWT secret from environment
	const secret = c.env.JWT_SECRET
	if (!secret) {
		throw new Error("JWT_SECRET not configured")
	}

	// Generate token
	const token = await generateToken(
		{
			userId: body.userId,
			role: body.role,
		},
		secret
	)

	return c.json({
		token,
		expiresIn: 86400, // 24 hours in seconds
	})
})

/**
 * GET /v1/auth/me
 * Get current user info (protected route)
 */
app.get("/me", requireAuth(), (c) => {
	const user = c.get("user")
	return c.json(user)
})

export default app
