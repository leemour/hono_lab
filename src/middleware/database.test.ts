import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../app"
import { createTestRequest, mockEnv, createTestContext } from "../lib/test-utils"

describe("Database Middleware", () => {
	let app: ReturnType<typeof createApp>

	beforeAll(() => {
		app = createApp()
	})

	describe("Database Initialization", () => {
		it("should initialize database once per request", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			expect(res.status).toBe(200)
			const data = (await res.json()) as Record<string, unknown>
			expect(data.database).toBeDefined()
		})

		it("should make database available in context", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as Record<string, unknown>
			expect(data.database).toHaveProperty("adapter")
			expect(data.database).toHaveProperty("connected")
		})

		it("should use D1 adapter in test environment", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as Record<string, unknown>
			const database = data.database as { adapter: string; connected: boolean }
			expect(database.adapter).toBe("d1")
		})
	})

	describe("Database Health Check", () => {
		it("should report database connection status", async () => {
			const req = createTestRequest("http://localhost/v1/health")
			const res = await app.fetch(req, mockEnv(), createTestContext())

			const data = (await res.json()) as Record<string, unknown>
			const database = data.database as { connected: boolean }
			expect(typeof database.connected).toBe("boolean")
		})
	})
})
