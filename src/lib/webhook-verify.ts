import { createMiddleware } from "hono/factory"
import type { AppContext } from "../core/types"
import { UnauthorizedError } from "../core/errors"

/**
 * Verify HMAC-SHA256 signature using Web Crypto API
 * @param payload - The raw payload to verify
 * @param signature - The signature to verify against (hex encoded)
 * @param secret - The secret key for HMAC
 * @returns Promise<boolean> - True if signature is valid
 */
export async function verifyHmacSignature(
	payload: string,
	signature: string,
	secret: string
): Promise<boolean> {
	try {
		// Convert secret to key
		const encoder = new TextEncoder()
		const keyData = encoder.encode(secret)
		const key = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign", "verify"]
		)

		// Compute HMAC
		const payloadData = encoder.encode(payload)
		const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData)

		// Convert to hex string
		const computedSignature = Array.from(new Uint8Array(signatureBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")

		// Constant-time comparison to prevent timing attacks
		return timingSafeEqual(computedSignature, signature.toLowerCase())
	} catch (error) {
		console.error("Error verifying HMAC signature:", error)
		return false
	}
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns boolean - True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false
	}

	let result = 0
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i)
	}
	return result === 0
}

/**
 * Middleware to verify webhook signatures
 * Reads signature from x-webhook-signature header and verifies against request body
 * @param secret - The secret key for HMAC verification
 * @returns Hono middleware
 */
export function verifyWebhookSignature(secret: string) {
	return createMiddleware<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>(
		async (c, next) => {
			// Get signature from header
			const signature = c.req.header("x-webhook-signature")
			if (!signature) {
				throw new UnauthorizedError("Missing webhook signature")
			}

			// Get raw request body
			const body = await c.req.text()

			// Verify signature
			const isValid = await verifyHmacSignature(body, signature, secret)
			if (!isValid) {
				throw new UnauthorizedError("Invalid webhook signature")
			}

			await next()
		}
	)
}
