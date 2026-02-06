/**
 * Environment bindings available in the application
 */
export type Bindings = {
	// Environment
	ENVIRONMENT: "development" | "test" | "production"
	LOG_LEVEL?: "debug" | "info" | "warn" | "error"

	// Database - SQLite (local dev)
	SQLITE_DB_PATH?: string

	// Database - D1 (Cloudflare Workers)
	DB?: D1Database

	// Database - PostgreSQL (Docker/VM)
	DATABASE_URL?: string

	// JWT Authentication
	JWT_SECRET?: string

	// Sentry
	SENTRY_DSN?: string
	SENTRY_ENVIRONMENT?: string
	SENTRY_RELEASE?: string

	// Cloudflare bindings
	ASSETS?: Fetcher
}
