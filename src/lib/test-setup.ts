import { applyD1Migrations, env } from "cloudflare:test"

/**
 * Apply migrations before tests run
 * This runs before each test file
 */
;(async () => {
	;(globalThis as typeof globalThis & { __TEST__?: boolean }).__TEST__ = true

	if (env.DB && env.TEST_MIGRATIONS) {
		try {
			await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
		} catch (error) {
			console.error("Failed to apply migrations:", error)
			// Don't throw - let tests run and fail naturally if DB isn't set up
		}
	}
})()
