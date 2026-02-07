import { eq, count } from "drizzle-orm"
import type { IDatabase, Webhook, NewWebhook } from "../lib/db"
import { webhooks } from "../lib/db"

/**
 * WebhookService handles all webhook-related business logic
 * Uses the IDatabase interface for database operations (adapter pattern)
 */
export class WebhookService {
	constructor(private db: IDatabase) {}

	/**
	 * Create a new webhook record
	 */
	async create(data: Omit<NewWebhook, "id" | "receivedAt">): Promise<Webhook> {
		const drizzle = this.db.getDrizzle()
		const [webhook] = await drizzle
			.insert(webhooks)
			.values({
				url: data.url,
				method: data.method || "POST",
				headers: data.headers,
				body: data.body,
			})
			.returning()
		return webhook
	}

	/**
	 * Find webhook by ID
	 */
	async findById(id: number): Promise<Webhook | undefined> {
		const drizzle = this.db.getDrizzle()
		const [webhook] = await drizzle.select().from(webhooks).where(eq(webhooks.id, id)).limit(1)
		return webhook
	}

	/**
	 * List webhooks with pagination
	 */
	async list(options: { limit?: number; offset?: number } = {}): Promise<{
		data: Webhook[]
		total: number
	}> {
		const limit = options.limit || 20
		const offset = options.offset || 0

		const drizzle = this.db.getDrizzle()

		// Get webhooks
		const data = await drizzle
			.select()
			.from(webhooks)
			.limit(limit)
			.offset(offset)
			.orderBy(webhooks.receivedAt)

		// Get total count using count() aggregation
		const countResult = await drizzle.select({ count: count() }).from(webhooks)

		const total = countResult[0]?.count ? Number(countResult[0].count) : 0

		return {
			data,
			total,
		}
	}

	/**
	 * Mark webhook as processed
	 */
	async markProcessed(id: number): Promise<void> {
		const drizzle = this.db.getDrizzle()
		await drizzle.update(webhooks).set({ processedAt: new Date() }).where(eq(webhooks.id, id))
	}
}
