# Deployment

This project supports Cloudflare Workers (primary).

## Cloudflare Workers

### Build and Deploy
```bash
pnpm deploy
```

### D1 Migrations (remote)
```bash
pnpm db:migrate:d1
```

### Secrets
Use Wrangler secrets for production:
```bash
wrangler secret put JWT_SECRET
wrangler secret put SENTRY_DSN
```

### Notes
- Workers uses D1 (SQLite) via the `DB` binding in `wrangler.jsonc`.
