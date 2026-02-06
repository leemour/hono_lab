import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../app"
import { createTestRequest, mockEnv, createTestContext } from "../lib/test-utils"

describe("Correlation ID Middleware", () => {
	// Let TypeScript infer the app type from createApp()
	let app: ReturnType<typeof createApp>

	beforeAll(() => {
		app = createApp()
	})

	describe("ID Generation", () => {
		it("should generate valid UUID v4 when no ID provided", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const correlationId = res.headers.get("x-correlation-id")
			expect(correlationId).toBeDefined()
			expect(correlationId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
			)
		})

		it("should generate different IDs for each request", async () => {
			const req1 = createTestRequest("http://localhost/v1/health")
			const res1 = await app.fetch(req1, mockEnv(), createTestContext())

			const req2 = createTestRequest("http://localhost/v1/health")
			const res2 = await app.fetch(req2, mockEnv(), createTestContext())

			const id1 = res1.headers.get("x-correlation-id")
			const id2 = res2.headers.get("x-correlation-id")
			expect(id1).not.toBe(id2)
		})
	})

	describe("Custom Correlation ID", () => {
		it("should use provided x-correlation-id header", async () => {
			const customId = "custom-correlation-id-123"
			const req = createTestRequest("http://localhost/v1/health", {
				headers: { "x-correlation-id": customId },
			})
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("x-correlation-id")).toBe(customId)
		})

		it("should preserve custom ID format (non-UUID)", async () => {
			const customId = "my-custom-format-12345"
			const req = createTestRequest("http://localhost/v1/health", {
				headers: { "x-correlation-id": customId },
			})
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("x-correlation-id")).toBe(customId)
		})
	})

	describe("Cloudflare Ray ID Fallback", () => {
		it("should use cf-ray header when no x-correlation-id", async () => {
			const cfRay = "cf-ray-12345"
			const req = createTestRequest("http://localhost/v1/health", {
				headers: { "cf-ray": cfRay },
			})
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("x-correlation-id")).toBe(cfRay)
		})

		it("should prefer x-correlation-id over cf-ray", async () => {
			const correlationId = "correlation-123"
			const cfRay = "cf-ray-456"
			const req = createTestRequest("http://localhost/v1/health", {
				headers: {
					"x-correlation-id": correlationId,
					"cf-ray": cfRay,
				},
			})
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.get("x-correlation-id")).toBe(correlationId)
			expect(res.headers.get("x-correlation-id")).not.toBe(cfRay)
		})
	})

	describe("Response Header", () => {
		it("should always include x-correlation-id in response", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.headers.has("x-correlation-id")).toBe(true)
		})

		it("should include correlation ID in response for all routes", async () => {
			const routes = ["/v1/health", "/invalid-route", "/api/test"]

			for (const route of routes) {
				const req = createTestRequest(`http://localhost${route}`)
				const res = await app.fetch(req, mockEnv(), createTestContext())
				expect(res.headers.has("x-correlation-id")).toBe(true)
			}
		})
	})
})
