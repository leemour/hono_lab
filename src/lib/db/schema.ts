import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/**
 * Webhooks table schema
 * Stores received webhook requests with their metadata
 */
export const webhooks = sqliteTable("webhooks", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	url: text("url").notNull(),
	method: text("method").notNull().default("POST"),
	headers: text("headers").notNull(), // JSON string
	body: text("body"), // JSON string or null
	receivedAt: integer("received_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	processedAt: integer("processed_at", { mode: "timestamp" }),
})

export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert
