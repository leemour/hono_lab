# Testing

## Authentication

### Generate JWT Token

To get a JWT token for authenticated endpoints:

```bash
http POST localhost:8787/v1/auth/token userId="user123" role="admin"
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### Use JWT Token

Use the token in the `Authorization` header for authenticated endpoints:

```bash
http GET localhost:8787/v1/auth/me \
  Authorization:"Bearer <token>"
```

## Webhooks

Webhook endpoints use **HMAC-SHA256 signatures** for verification, not JWT tokens.

### Generate Signed Webhook Request

Use the built-in script to generate a properly signed webhook request:

```bash
pnpm webhook:sign '{"message":"Hello, world!"}'
```

This will output a ready-to-use `http` command with the correct signature:

```bash
echo -n '{"message":"Hello, world!"}' | http POST localhost:8787/v1/webhooks/receive \
  x-webhook-signature:27093ea3d8c625c743fe9dce7a660ec49fbe194113cebe8dd8339675d9469fe1 \
  content-type:application/json
```

### How Webhook Signatures Work

1. The webhook signature is an **HMAC-SHA256** hash of the request body
2. It uses the `WEBHOOK_SECRET` from your `.env` file
3. The signature must be sent in the `x-webhook-signature` header
4. The server computes the same hash and compares it to verify the request

**Important:** JWT tokens from `/v1/auth/token` are for authenticated API endpoints, **not** for webhook verification. They are two separate authentication mechanisms:
- **JWT tokens** → For user/API authentication (use `Authorization: Bearer <token>`)
- **HMAC signatures** → For webhook payload integrity verification (use `x-webhook-signature: <hash>`)

### Manual Signature Generation (if needed)

If you need to generate the signature manually:

```bash
WEBHOOK_SECRET="your-webhook-secret-from-.env"
PAYLOAD='{"message":"Hello, world!"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

echo -n "$PAYLOAD" | http POST localhost:8787/v1/webhooks/receive \
  x-webhook-signature:$SIGNATURE \
  content-type:application/json
```
