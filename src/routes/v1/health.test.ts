import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../app"
import { createTestRequest, mockEnv, createTestContext } from "../../lib/test-utils"

describe("Health Endpoint", () => {
	// Let TypeScript infer the app type from createApp()
	let app: ReturnType<typeof createApp>

	beforeAll(() => {
		app = createApp()
	})

	describe("GET /v1/health", () => {
		it("should return 200 status code", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.status).toBe(200)
		})

		it("should return healthy status with required fields", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as Record<string, unknown>
			expect(data).toMatchObject({
				status: "healthy",
				version: "1.0.0",
				environment: "test",
			})
			expect(data.timestamp).toBeDefined()
			expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
		})

		it("should include database connection info", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as Record<string, unknown>
			expect(data.database).toBeDefined()
			expect(data.database).toHaveProperty("adapter")
			expect(data.database).toHaveProperty("connected")
		})
	})

	describe("Headers", () => {
		it("should include correlation ID header", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const correlationId = res.headers.get("x-correlation-id")
			expect(correlationId).toBeDefined()
			expect(correlationId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
			)
		})

		it("should include security headers", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("x-content-type-options")).toBe("nosniff")
			expect(res.headers.get("x-frame-options")).toBe("DENY")
			expect(res.headers.get("x-xss-protection")).toBe("1; mode=block")
		})

		it("should include content-type as JSON", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("content-type")).toContain("application/json")
		})
	})
})
