# Hono Lab

A production-ready Hono API template that runs on Cloudflare Workers or Node.js. It ships with a middleware stack, structured logging, database adapters (D1/SQLite), auth, webhooks, and tests.

## Functionality
- API versioning (`/v1`)
- Health endpoint with DB status
- JWT auth endpoints
- Webhook ingestion and listing
- Middleware: correlation IDs, logging, error handling, security headers
- Drizzle ORM migrations for SQLite

## Dependencies
- Node.js 22+
- pnpm 9+
- Wrangler (Workers dev/deploy)

## Environments
Use `.env.example` as the base. The repo also includes `.env.development`, `.env.docker`, and `.env.docker.dev`.

Key variables:
- `JWT_SECRET`
- `LOG_LEVEL`
- `SQLITE_DB_PATH` (SQLite)
- `SENTRY_*` (optional)

## Databases
- Cloudflare D1 (Workers)
- SQLite (local dev)

The adapter is auto-selected based on bindings/env.

## Releases
- Deploy Workers: `pnpm deploy`
- D1 migrations: `pnpm db:migrate:d1`

## Quick Reference Commands
Install:
```bash
pnpm install
```

Dev (Workers):
```bash
pnpm dev
```

Tests:
```bash
pnpm test
```

Lint/format:
```bash
pnpm check
```

SQLite migrations:
```bash
pnpm db:migrate:local
```

## Docs
- [docs/SETUP.md](docs/SETUP.md)
- [docs/DB.md](docs/DB.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/NODE.md](docs/NODE.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
