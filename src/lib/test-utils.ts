import { env } from "cloudflare:test"
import type { ExecutionContext } from "@cloudflare/workers-types"
import type { Bindings } from "../core/config"

/**
 * Create a mock Hono ExecutionContext for testing
 */
export function createTestContext(): ExecutionContext {
	return {
		waitUntil: () => {},
		passThroughOnException: () => {},
		props: {},
	} as unknown as ExecutionContext
}

/**
 * Create a Request object for testing
 */
export function createTestRequest(url: string, init?: RequestInit): Request {
	return new Request(url, init)
}

/**
 * Create mock environment bindings for testing
 * Uses the test D1 database binding from Cloudflare's test environment
 */
export function mockEnv(overrides?: Partial<Bindings>): Bindings {
	return {
		ENVIRONMENT: "test",
		LOG_LEVEL: "silent",
		DB: env.DB, // Use the D1 database from the test environment
		...overrides,
	} as Bindings
}

/**
 * Helper to check if UUID v4 format
 */
export function isValidUUIDv4(uuid: string): boolean {
	const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	return uuidV4Regex.test(uuid)
}
