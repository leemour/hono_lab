declare module "cloudflare:test" {
	export interface D1Migration {
		name: string
		queries: string[]
	}

	export const env: {
		DB?: D1Database
		TEST_MIGRATIONS?: D1Migration[]
	} & Record<string, unknown>

	export function applyD1Migrations(
		db: D1Database,
		migrations: D1Migration[],
		migrationsTableName?: string
	): Promise<void>
}
