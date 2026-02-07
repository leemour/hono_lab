import { describe, it, expect } from "vitest"
import { generateToken, verifyToken } from "./jwt"

describe("JWT Utilities", () => {
	const secret = "test-secret-key"

	describe("generateToken", () => {
		it("should generate a valid JWT token", async () => {
			const payload = { userId: "user123", role: "admin" }
			const token = await generateToken(payload, secret)

			expect(typeof token).toBe("string")
			expect(token.split(".").length).toBe(3) // JWT has 3 parts
		})

		it("should include payload data in token", async () => {
			const payload = { userId: "user456", role: "user" }
			const token = await generateToken(payload, secret)

			const decoded = await verifyToken(token, secret)
			expect(decoded.userId).toBe("user456")
			expect(decoded.role).toBe("user")
		})

		it("should include iat and exp in token", async () => {
			const payload = { userId: "user789" }
			const token = await generateToken(payload, secret)

			const decoded = await verifyToken(token, secret)
			expect(decoded.iat).toBeDefined()
			expect(decoded.exp).toBeDefined()
			expect(typeof decoded.iat).toBe("number")
			expect(typeof decoded.exp).toBe("number")
		})

		it("should respect custom expiration time", async () => {
			const payload = { userId: "user000" }
			const expiresIn = 3600 // 1 hour
			const token = await generateToken(payload, secret, expiresIn)

			const decoded = await verifyToken(token, secret)
			expect(decoded.iat).toBeDefined()
			expect(decoded.exp).toBeDefined()
			if (typeof decoded.iat !== "number" || typeof decoded.exp !== "number") {
				throw new Error("Token timestamps are not numbers")
			}
			expect(decoded.exp).toBe(decoded.iat + expiresIn)
		})
	})

	describe("verifyToken", () => {
		it("should verify and decode valid token", async () => {
			const payload = { userId: "user123", role: "admin" }
			const token = await generateToken(payload, secret)

			const decoded = await verifyToken(token, secret)
			expect(decoded.userId).toBe("user123")
			expect(decoded.role).toBe("admin")
		})

		it("should reject token with wrong secret", async () => {
			const payload = { userId: "user123" }
			const token = await generateToken(payload, secret)

			await expect(verifyToken(token, "wrong-secret")).rejects.toThrow("Invalid or expired token")
		})

		it("should reject malformed token", async () => {
			const invalidToken = "not.a.valid.jwt.token"

			await expect(verifyToken(invalidToken, secret)).rejects.toThrow("Invalid or expired token")
		})

		it("should reject expired token", async () => {
			// Generate token that expires immediately
			const payload = { userId: "user123" }
			const token = await generateToken(payload, secret, -1) // Expired 1 second ago

			await expect(verifyToken(token, secret)).rejects.toThrow("Invalid or expired token")
		})
	})
})
