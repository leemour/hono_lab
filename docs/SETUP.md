# Setup

## Prerequisites
- Node.js 22+
- pnpm 9+
- Wrangler (for Workers dev and deploy)

## Install
```bash
pnpm install
```

## Environment
```bash
cp .env.example .env
```

Key variables:
- `JWT_SECRET` (required for auth)
- `LOG_LEVEL` (info | warn | error | debug | silent)
- `SQLITE_DB_PATH` (SQLite)
- `SENTRY_*` (optional, for releases and error reporting)

## Local Development
Workers (D1/SQLite):
```bash
pnpm dev
```

Node.js (SQLite):
```bash
pnpm dev:node
```

## Database Migrations
SQLite (local):
```bash
pnpm db:migrate:local
```

D1 (Workers):
```bash
pnpm db:migrate:d1
```

## Type Generation (Workers bindings)
```bash
pnpm cf-typegen
```

## Next Docs
- `docs/DB.md`
- `docs/DEPLOYMENT.md`
- `docs/NODE.md`
- `docs/TESTING.md`
