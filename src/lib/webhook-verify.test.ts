import { describe, it, expect } from "vitest"
import { verifyHmacSignature, verifyWebhookSignature } from "./webhook-verify"
import { Hono } from "hono"
import type { AppContext } from "../core/types"

describe("Webhook Signature Verification", () => {
	describe("verifyHmacSignature", () => {
		it("should verify valid HMAC signature", async () => {
			const payload = '{"test":"data"}'
			const secret = "my-secret-key"

			// Generate signature
			const encoder = new TextEncoder()
			const keyData = encoder.encode(secret)
			const key = await crypto.subtle.importKey(
				"raw",
				keyData,
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"]
			)
			const payloadData = encoder.encode(payload)
			const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData)
			const signature = Array.from(new Uint8Array(signatureBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")

			const isValid = await verifyHmacSignature(payload, signature, secret)
			expect(isValid).toBe(true)
		})

		it("should reject invalid signature", async () => {
			const payload = '{"test":"data"}'
			const secret = "my-secret-key"
			const invalidSignature = "0".repeat(64)

			const isValid = await verifyHmacSignature(payload, invalidSignature, secret)
			expect(isValid).toBe(false)
		})

		it("should reject signature with wrong secret", async () => {
			const payload = '{"test":"data"}'
			const secret = "my-secret-key"
			const wrongSecret = "wrong-secret"

			// Generate signature with correct secret
			const encoder = new TextEncoder()
			const keyData = encoder.encode(secret)
			const key = await crypto.subtle.importKey(
				"raw",
				keyData,
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"]
			)
			const payloadData = encoder.encode(payload)
			const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData)
			const signature = Array.from(new Uint8Array(signatureBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")

			// Verify with wrong secret
			const isValid = await verifyHmacSignature(payload, signature, wrongSecret)
			expect(isValid).toBe(false)
		})

		it("should handle uppercase signatures", async () => {
			const payload = '{"test":"data"}'
			const secret = "my-secret-key"

			// Generate signature
			const encoder = new TextEncoder()
			const keyData = encoder.encode(secret)
			const key = await crypto.subtle.importKey(
				"raw",
				keyData,
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"]
			)
			const payloadData = encoder.encode(payload)
			const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData)
			const signature = Array.from(new Uint8Array(signatureBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")
				.toUpperCase()

			const isValid = await verifyHmacSignature(payload, signature, secret)
			expect(isValid).toBe(true)
		})
	})

	describe("verifyWebhookSignature middleware", () => {
		it("should allow request with valid signature", async () => {
			const app = new Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>()
			const secret = "test-secret"
			const payload = '{"test":"data"}'

			// Generate signature
			const encoder = new TextEncoder()
			const keyData = encoder.encode(secret)
			const key = await crypto.subtle.importKey(
				"raw",
				keyData,
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"]
			)
			const payloadData = encoder.encode(payload)
			const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData)
			const signature = Array.from(new Uint8Array(signatureBuffer))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")

			app.onError((err, c) => {
				return c.json({ error: err.message }, 500)
			})
			app.use("*", verifyWebhookSignature(secret))
			app.post("/webhook", (c) => c.json({ success: true }))

			const response = await app.request("/webhook", {
				method: "POST",
				headers: {
					"x-webhook-signature": signature,
					"Content-Type": "application/json",
				},
				body: payload,
			})

			expect(response.status).toBe(200)
			const data = (await response.json()) as { success: boolean }
			expect(data.success).toBe(true)
		})

		it("should reject request with missing signature", async () => {
			const app = new Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>()
			const secret = "test-secret"

			app.onError((err, c) => {
				const status = ((err as { statusCode?: number }).statusCode ?? 500) as
					| 400
					| 401
					| 403
					| 404
					| 409
					| 500
				return c.json({ error: err.message }, status)
			})
			app.use("*", verifyWebhookSignature(secret))
			app.post("/webhook", (c) => c.json({ success: true }))

			const response = await app.request("/webhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: '{"test":"data"}',
			})

			expect(response.status).toBe(401)
		})

		it("should reject request with invalid signature", async () => {
			const app = new Hono<{ Bindings: AppContext["env"]; Variables: AppContext["var"] }>()
			const secret = "test-secret"

			app.onError((err, c) => {
				const status = ((err as { statusCode?: number }).statusCode ?? 500) as
					| 400
					| 401
					| 403
					| 404
					| 409
					| 500
				return c.json({ error: err.message }, status)
			})
			app.use("*", verifyWebhookSignature(secret))
			app.post("/webhook", (c) => c.json({ success: true }))

			const response = await app.request("/webhook", {
				method: "POST",
				headers: {
					"x-webhook-signature": "0".repeat(64),
					"Content-Type": "application/json",
				},
				body: '{"test":"data"}',
			})

			expect(response.status).toBe(401)
		})
	})
})
