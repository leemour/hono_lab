import path from "node:path"
import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config"

const migrationsPath = path.join(process.cwd(), "migrations")
const migrations = await readD1Migrations(migrationsPath)

export default defineWorkersConfig({
	test: {
		reporters: ["verbose"],
		setupFiles: ["./src/lib/test-setup.ts"],
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: {
					bindings: {
						ENVIRONMENT: "test",
						LOG_LEVEL: "info",
						TEST_MIGRATIONS: migrations,
					},
				},
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/index.ts", "src/server.ts", "src/core/config.ts"],
		},
	},
})
