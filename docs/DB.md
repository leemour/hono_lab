# Database

The app supports two adapters:
- Cloudflare D1 (Workers)
- SQLite (local development)

Adapter selection happens at runtime:
- `env.DB` -> D1
- fallback -> SQLite (`SQLITE_DB_PATH` or `./db/local.db`)

## Migration Layout
```
db/
└── migrations/
    ├── meta/
    │   └── _journal.json
    └── 0000_sqlite.sql
```

## Generate Migrations
```bash
pnpm db:generate:sqlite
```

## Run Migrations
SQLite (local):
```bash
pnpm db:migrate:local
```

D1 (remote):
```bash
pnpm db:migrate:d1
```

## Schema Changes
1. Update `src/lib/db/schema.ts`
2. Generate migrations for SQLite
3. Verify SQL files
4. Run migrations locally

## Optimization Note: One DB per Request
Database initialization is handled in middleware and stored on the Hono context so that each request reuses a single adapter instance rather than creating one per route handler.

Before (anti-pattern):
```ts
// In a route handler
const db = await createDatabase(c.env)
```

After (recommended):
```ts
// In middleware
if (!c.get("db")) {
  const db = await createDatabase(c.env)
  c.set("db", db)
}

// In routes
const db = c.get("db")
```

Benefits:
- One initialization per request context
- Cleaner logs and tests
- Less overhead per request

## Troubleshooting
- SQLite syntax errors: ensure you are in `db/migrations`
- Connection failures: verify D1 binding
