import { Hono } from "hono"
import type { Bindings } from "../../core/config"
import type { IDatabase } from "../../lib/db"
import { NotFoundError, ValidationError, InternalServerError } from "../../core/errors"
import { WebhookService } from "../../services/webhooks"
import { verifyWebhookSignature } from "../../lib/webhook-verify"

const app = new Hono<{
	Bindings: Bindings
	Variables: {
		correlationId: string
		requestStartTime: number
		db?: IDatabase
		user?: { userId: string; role?: string }
	}
}>()

/**
 * POST /v1/webhooks/receive
 * Receive and store a webhook
 * Optionally verifies webhook signature if WEBHOOK_SECRET is configured
 */
app.post("/receive", async (c) => {
	const db = c.get("db")
	if (!db) {
		throw new InternalServerError("Database not initialized")
	}

	// Optional webhook signature verification
	const webhookSecret = c.env.WEBHOOK_SECRET
	if (webhookSecret) {
		// Verify signature using middleware inline
		const signature = c.req.header("x-webhook-signature")
		if (!signature) {
			throw new ValidationError("Missing webhook signature (x-webhook-signature header required)")
		}
		
		// Clone request to read body for verification
		const clonedRequest = c.req.raw.clone()
		const bodyForVerification = await clonedRequest.text()
		
		// Import and verify
		const { verifyHmacSignature } = await import("../../lib/webhook-verify")
		const isValid = await verifyHmacSignature(bodyForVerification, signature, webhookSecret)
		if (!isValid) {
			throw new ValidationError("Invalid webhook signature")
		}
	}

	// Get request details
	const url = c.req.url
	const method = c.req.method
	const body = await c.req.text()

	// Get headers (sanitize sensitive ones)
	const headers: Record<string, string> = {}
	const sensitiveHeaders = new Set(['authorization', 'x-api-key', 'x-auth-token', 'cookie'])
	c.req.raw.headers.forEach((value, key) => {
		// Exclude specific sensitive headers
		if (!sensitiveHeaders.has(key.toLowerCase())) {
			headers[key] = value
		}
	})

	// Validate body is valid JSON if present
	if (body) {
		try {
			JSON.parse(body)
		} catch (_error) {
			throw new ValidationError("Invalid JSON body")
		}
	}

	// Create webhook record
	const webhookService = new WebhookService(db)
	const webhook = await webhookService.create({
		url,
		method,
		headers: JSON.stringify(headers),
		body: body || null,
	})

	return c.json(
		{
			id: webhook.id,
			receivedAt: webhook.receivedAt,
		},
		201
	)
})

/**
 * GET /v1/webhooks
 * List webhooks with pagination
 */
app.get("/", async (c) => {
	const db = c.get("db")
	if (!db) {
		throw new InternalServerError("Database not initialized")
	}

	// Parse pagination params
	const limitParam = c.req.query("limit")
	const offsetParam = c.req.query("offset")

	let limit = 20
	let offset = 0

	if (limitParam) {
		limit = Number.parseInt(limitParam, 10)
		if (Number.isNaN(limit) || limit < 1) {
			throw new ValidationError("Invalid limit parameter")
		}
		if (limit > 100) {
			limit = 100 // Max limit
		}
	}

	if (offsetParam) {
		offset = Number.parseInt(offsetParam, 10)
		if (Number.isNaN(offset) || offset < 0) {
			throw new ValidationError("Invalid offset parameter")
		}
	}

	// Get webhooks
	const webhookService = new WebhookService(db)
	const result = await webhookService.list({ limit, offset })

	return c.json({
		data: result.data,
		pagination: {
			limit,
			offset,
			total: result.total,
		},
	})
})

/**
 * GET /v1/webhooks/:id
 * Get a single webhook by ID
 */
app.get("/:id", async (c) => {
	const db = c.get("db")
	if (!db) {
		throw new InternalServerError("Database not initialized")
	}

	const idParam = c.req.param("id")
	const id = Number.parseInt(idParam, 10)

	if (Number.isNaN(id)) {
		throw new ValidationError("Invalid webhook ID")
	}

	const webhookService = new WebhookService(db)
	const webhook = await webhookService.findById(id)

	if (!webhook) {
		throw new NotFoundError(`Webhook with ID ${id} not found`)
	}

	return c.json(webhook)
})

export default app
