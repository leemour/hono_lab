import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../app"
import { createTestRequest, mockEnv, createTestContext } from "../../lib/test-utils"
import { generateToken } from "../../lib/auth/jwt"
import type { ErrorResponse } from "../../core/types"

describe("Auth Routes", () => {
	let app: ReturnType<typeof createApp>

	beforeAll(() => {
		app = createApp()
	})

	describe("POST /v1/auth/token", () => {
		it("should generate token for valid request", async () => {
			const req = createTestRequest("http://localhost/v1/auth/token", {
				method: "POST",
				body: JSON.stringify({ userId: "user123", role: "admin" }),
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as { token: string; expiresIn: number }
			expect(typeof data.token).toBe("string")
			expect(data.expiresIn).toBe(86400)
		})

		it("should reject request without userId", async () => {
			const req = createTestRequest("http://localhost/v1/auth/token", {
				method: "POST",
				body: JSON.stringify({ role: "admin" }),
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(400)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("VALIDATION_ERROR")
			expect(data.error.message).toContain("userId")
		})

		it("should reject request with invalid userId type", async () => {
			const req = createTestRequest("http://localhost/v1/auth/token", {
				method: "POST",
				body: JSON.stringify({ userId: 123 }),
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(400)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("VALIDATION_ERROR")
		})

		it("should generate token without role", async () => {
			const req = createTestRequest("http://localhost/v1/auth/token", {
				method: "POST",
				body: JSON.stringify({ userId: "user456" }),
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as { token: string }
			expect(data).toHaveProperty("token")
		})
	})

	describe("GET /v1/auth/me", () => {
		it("should return user info for valid token", async () => {
			const secret = "test-secret"
			const token = await generateToken({ userId: "user123", role: "admin" }, secret)

			const req = createTestRequest("http://localhost/v1/auth/me", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = secret
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as {
				userId: string
				role?: string
				iat?: number
				exp?: number
			}
			expect(data.userId).toBe("user123")
			expect(data.role).toBe("admin")
			expect(data.iat).toBeDefined()
			expect(data.exp).toBeDefined()
		})

		it("should reject request without authorization header", async () => {
			const req = createTestRequest("http://localhost/v1/auth/me")

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(401)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("UNAUTHORIZED")
			expect(data.error.message).toContain("authorization header")
		})

		it("should reject request with invalid authorization format", async () => {
			const req = createTestRequest("http://localhost/v1/auth/me", {
				headers: {
					Authorization: "InvalidFormat token123",
				},
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(401)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("UNAUTHORIZED")
			expect(data.error.message).toContain("Bearer")
		})

		it("should reject request with invalid token", async () => {
			const req = createTestRequest("http://localhost/v1/auth/me", {
				headers: {
					Authorization: "Bearer invalid.token.here",
				},
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = "test-secret"
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(401)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("UNAUTHORIZED")
			expect(data.error.message).toContain("Invalid or expired")
		})

		it("should reject expired token", async () => {
			const secret = "test-secret"
			const token = await generateToken({ userId: "user123" }, secret, -1) // Expired

			const req = createTestRequest("http://localhost/v1/auth/me", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			const testEnv = mockEnv()
			testEnv.JWT_SECRET = secret
			const response = await app.fetch(req, testEnv, createTestContext())

			expect(response.status).toBe(401)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("UNAUTHORIZED")
		})
	})
})
