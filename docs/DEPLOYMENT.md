# Deployment

This project supports Cloudflare Workers (primary).

## Prerequisites

Before deploying, ensure you have:
1. Cloudflare account with Workers enabled
2. Wrangler CLI installed (`pnpm install` includes it)
3. Authenticated with Cloudflare: `pnpm wrangler login`

## Initial Setup

### 1. Create D1 Database

Create the production D1 database:

```bash
pnpm wrangler d1 create hono-lab2-db
```

After creating the database, update the `database_id` in `wrangler.jsonc`:

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "hono-lab2-db",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
]
```

### 2. Run Database Migrations

**IMPORTANT:** You must run migrations before the app can work in production:

```bash
pnpm db:migrate:d1
```

This creates the `webhooks` table and any other required schema in your production D1 database.

### 3. Set Environment Secrets

Configure production secrets using Wrangler:

```bash
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put WEBHOOK_SECRET
pnpm wrangler secret put SENTRY_DSN  # Optional
```

## Deployment

### Deploy to Production

```bash
pnpm run deploy
```

This will build and deploy your Worker to Cloudflare.

## Post-Deployment

### Verify Deployment

Test your deployed endpoint:

```bash
# Health check
curl https://your-worker.workers.dev/v1/health

# Test webhook (use the signing script)
pnpm webhook:sign '{"test":"production"}' 
# Then use the generated command, replacing localhost:8787 with your production URL
```

### View Logs

```bash
pnpm wrangler tail
```

## Common Issues

### "Failed query: insert into webhooks" Error

**Cause:** Database migrations not applied to production D1.

**Solution:** Run the migrations:
```bash
pnpm db:migrate:d1
```

### Authentication/Signature Errors

**Cause:** Secrets not set in production.

**Solution:** Verify secrets are configured:
```bash
pnpm wrangler secret list
```

If missing, add them:
```bash
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put WEBHOOK_SECRET
```

## Notes

- Workers uses D1 (SQLite) via the `DB` binding in `wrangler.jsonc`
- Environment variables in `wrangler.jsonc` are public; use secrets for sensitive data
- Each deployment creates a new version; you can rollback in the Cloudflare dashboard
