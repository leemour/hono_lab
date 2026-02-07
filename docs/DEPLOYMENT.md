# Deployment

This project supports Cloudflare Workers (primary).

## Prerequisites

## D1 Database
```bash
pnpm wrangler d1 create hono-lab-db
```

After creating the database, add the database ID to the `wrangler.jsonc` file.
```json
"d1_databases": [
  {
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
]
```

## Environment Variables
```bash
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put SENTRY_DSN
pnpm wrangler secret put WEBHOOK_SECRET
```

## Cloudflare Workers

### Build and Deploy
```bash
pnpm run deploy
```

### D1 Migrations (remote)
```bash
pnpm db:migrate:d1
```

### Secrets
Use Wrangler secrets for production:
```bash
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put SENTRY_DSN
pnpm wrangler secret put WEBHOOK_SECRET
```

### Notes
- Workers uses D1 (SQLite) via the `DB` binding in `wrangler.jsonc`.
