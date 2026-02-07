import { describe, it, expect, beforeAll } from "vitest"
import { env } from "cloudflare:test"
import { createApp } from "../../app"
import { createTestRequest, mockEnv, createTestContext } from "../../lib/test-utils"
import type { ErrorResponse, PaginatedResponse } from "../../core/types"

type WebhookResponse = {
	id: number
	url: string
	method: string
	headers: string
	body?: string | null
	receivedAt: number | string
	processedAt?: number | string | null
}

describe("Webhook Routes", () => {
	let app: ReturnType<typeof createApp>

	beforeAll(async () => {
		app = createApp()

		// Apply migrations for D1 test database
		if (env.DB) {
			try {
				const createTableSQL = `
					CREATE TABLE IF NOT EXISTS webhooks (
						id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
						url TEXT NOT NULL,
						method TEXT DEFAULT 'POST' NOT NULL,
						headers TEXT NOT NULL,
						body TEXT,
						received_at INTEGER DEFAULT (unixepoch()) NOT NULL,
						processed_at INTEGER
					)
				`
				await env.DB.prepare(createTableSQL).run()
			} catch (error) {
				console.error("Failed to create webhooks table:", error)
			}
		}
	})

	describe("POST /v1/webhooks/receive", () => {
		it("should accept and store a valid webhook", async () => {
			const testPayload = { test: "data", value: 123 }

			const req = createTestRequest("http://localhost/v1/webhooks/receive", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(testPayload),
			})
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(201)

			const data = (await response.json()) as { id: number; receivedAt: number | string }
			expect(data).toHaveProperty("id")
			expect(data).toHaveProperty("receivedAt")
			expect(typeof data.id).toBe("number")
		})

		it("should reject invalid JSON body", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks/receive", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: "invalid json {",
			})
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(400)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("VALIDATION_ERROR")
			expect(data.error.message).toContain("Invalid JSON")
		})

		it("should accept webhook with empty body", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks/receive", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			})
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(201)

			const data = (await response.json()) as { id: number }
			expect(data).toHaveProperty("id")
		})
	})

	describe("GET /v1/webhooks", () => {
		it("should return empty list when no webhooks exist", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			if (response.status !== 200) {
				const text = await response.text()
				console.error("Response status:", response.status)
				console.error("Response body:", text)
			}

			expect(response.status).toBe(200)

			const data = (await response.json()) as PaginatedResponse<WebhookResponse>
			expect(data).toHaveProperty("data")
			expect(data).toHaveProperty("pagination")
			expect(Array.isArray(data.data)).toBe(true)
			expect(data.pagination.limit).toBe(20)
			expect(data.pagination.offset).toBe(0)
			expect(data.pagination.total).toBeGreaterThanOrEqual(0)
		})

		it("should return paginated webhooks", async () => {
			// Create some webhooks first
			const req1 = createTestRequest("http://localhost/v1/webhooks/receive", {
				method: "POST",
				body: JSON.stringify({ test: 1 }),
			})
			await app.fetch(req1, mockEnv(), createTestContext())

			const req2 = createTestRequest("http://localhost/v1/webhooks/receive", {
				method: "POST",
				body: JSON.stringify({ test: 2 }),
			})
			await app.fetch(req2, mockEnv(), createTestContext())

			const req = createTestRequest("http://localhost/v1/webhooks")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as PaginatedResponse<WebhookResponse>
			expect(data.data.length).toBeGreaterThan(0)
			expect(data.pagination.total).toBeGreaterThan(0)
		})

		it("should respect limit parameter", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks?limit=5")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as PaginatedResponse<WebhookResponse>
			expect(data.pagination.limit).toBe(5)
		})

		it("should enforce max limit of 100", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks?limit=200")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as PaginatedResponse<WebhookResponse>
			expect(data.pagination.limit).toBe(100)
		})

		it("should respect offset parameter", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks?offset=10")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as PaginatedResponse<WebhookResponse>
			expect(data.pagination.offset).toBe(10)
		})

		it("should reject invalid limit", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks?limit=invalid")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(400)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("VALIDATION_ERROR")
		})

		it("should reject invalid offset", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks?offset=-1")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(400)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("VALIDATION_ERROR")
		})
	})

	describe("GET /v1/webhooks/:id", () => {
		it("should return webhook by ID", async () => {
			// Create a webhook first
			const createReq = createTestRequest("http://localhost/v1/webhooks/receive", {
				method: "POST",
				body: JSON.stringify({ test: "data" }),
			})
			const createResponse = await app.fetch(createReq, mockEnv(), createTestContext())
			const createData = (await createResponse.json()) as { id: number }
			const webhookId = createData.id

			const req = createTestRequest(`http://localhost/v1/webhooks/${webhookId}`)
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(200)

			const data = (await response.json()) as WebhookResponse
			expect(data.id).toBe(webhookId)
			expect(data).toHaveProperty("url")
			expect(data).toHaveProperty("method")
			expect(data).toHaveProperty("headers")
			expect(data).toHaveProperty("body")
			expect(data).toHaveProperty("receivedAt")
		})

		it("should return 404 for non-existent webhook", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks/99999")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(404)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("NOT_FOUND")
			expect(data.error.message).toContain("99999")
		})

		it("should reject invalid ID", async () => {
			const req = createTestRequest("http://localhost/v1/webhooks/invalid")
			const response = await app.fetch(req, mockEnv(), createTestContext())

			expect(response.status).toBe(400)

			const data = (await response.json()) as ErrorResponse
			expect(data.error.code).toBe("VALIDATION_ERROR")
		})
	})
})
