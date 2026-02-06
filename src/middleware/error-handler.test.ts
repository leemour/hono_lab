import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../app"
import { createTestRequest, mockEnv, createTestContext } from "../lib/test-utils"

describe("Error Handler Middleware", () => {
	// Let TypeScript infer the app type from createApp()
	let app: ReturnType<typeof createApp>

	beforeAll(() => {
		app = createApp()
	})

	describe("404 Not Found", () => {
		it("should return 404 status for unknown routes", async () => {
			const req = createTestRequest("http://localhost/invalid-route")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.status).toBe(404)
		})

		it("should return error with NOT_FOUND code", async () => {
			const req = createTestRequest("http://localhost/invalid-route")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as { error: Record<string, unknown> }
			expect(data.error).toBeDefined()
			expect(data.error.code).toBe("NOT_FOUND")
			expect(data.error.message).toContain("invalid-route")
		})

		it("should include route method and path in error message", async () => {
			const req = createTestRequest("http://localhost/api/unknown")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as { error: Record<string, unknown> }
			expect(data.error.message).toContain("GET")
			expect(data.error.message).toContain("/api/unknown")
		})
	})

	describe("Error Response Format", () => {
		it("should return JSON content type", async () => {
			const req = createTestRequest("http://localhost/not-found")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("content-type")).toContain("application/json")
		})

		it("should include required error fields", async () => {
			const req = createTestRequest("http://localhost/not-found")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as { error: Record<string, unknown> }
			expect(data).toHaveProperty("error")
			expect(data.error).toHaveProperty("code")
			expect(data.error).toHaveProperty("message")
			expect(data.error).toHaveProperty("correlationId")
		})

		it("should include custom correlation ID when provided", async () => {
			const customId = "error-test-correlation-id"
			const req = createTestRequest("http://localhost/invalid-route", {
				headers: { "x-correlation-id": customId },
			})
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as { error: Record<string, unknown> }
			expect(data.error.correlationId).toBe(customId)
		})

		it("should generate correlation ID when not provided", async () => {
			const req = createTestRequest("http://localhost/invalid-route")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as { error: Record<string, unknown> }
			expect(data.error.correlationId).toBeDefined()
			expect(data.error.correlationId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
			)
		})
	})
})
