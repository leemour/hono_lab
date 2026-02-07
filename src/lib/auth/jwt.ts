import { sign, verify } from "hono/jwt"

/**
 * JWT token payload structure
 */
export interface TokenPayload extends Record<string, unknown> {
	userId: string
	role?: string
	iat?: number
	exp?: number
}

/**
 * Generate a JWT token
 * @param payload - The payload to encode in the token
 * @param secret - The secret key for signing
 * @param expiresIn - Expiration time in seconds (default: 24 hours)
 * @returns Promise<string> - The signed JWT token
 */
export async function generateToken(
	payload: { userId: string; role?: string } & Record<string, unknown>,
	secret: string,
	expiresIn: number = 86400 // 24 hours in seconds
): Promise<string> {
	const now = Math.floor(Date.now() / 1000)
	const fullPayload: TokenPayload = {
		...payload,
		iat: now,
		exp: now + expiresIn,
	}

	return await sign(fullPayload, secret, "HS256")
}

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @param secret - The secret key for verification
 * @returns Promise<TokenPayload> - The decoded token payload
 * @throws Error if token is invalid or expired
 */
export async function verifyToken(token: string, secret: string): Promise<TokenPayload> {
	try {
		const payload = await verify(token, secret, "HS256")
		if (!isTokenPayload(payload)) {
			throw new Error("Invalid or expired token")
		}
		return payload
	} catch (error) {
		const globalTestFlag = (globalThis as typeof globalThis & { __TEST__?: boolean }).__TEST__
		const isTestEnv =
			globalTestFlag === true ||
			(typeof process !== "undefined" &&
				(process.env?.NODE_ENV === "test" || process.env?.VITEST === "true"))

		if (!isTestEnv) {
			console.error("JWT verification error:", error)
		}
		throw new Error("Invalid or expired token")
	}
}

function isTokenPayload(payload: unknown): payload is TokenPayload {
	if (typeof payload !== "object" || payload === null) {
		return false
	}
	const userId = (payload as { userId?: unknown }).userId
	return typeof userId === "string" && userId.length > 0
}
