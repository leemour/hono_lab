# Testing

The project uses Vitest with the Cloudflare Workers pool.

## Run Tests
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Test Utilities
Helpers live in `src/lib/test-utils.ts`:
- `createTestRequest(url, init?)`
- `mockEnv(overrides?)`
- `createTestContext()`
- `getResponseJson<T>(response)`
- `isValidUUIDv4(uuid)`

## Structure and Style
- Use nested `describe` blocks for hierarchy
- Prefer Arrange / Act / Assert
- Keep tests focused on one behavior

Example structure:
```ts
describe("Feature", () => {
  let app: Hono

  beforeAll(() => {
    app = createApp()
  })

  describe("Specific behavior", () => {
    it("should do something", async () => {
      const req = createTestRequest("http://localhost/api/endpoint")
      const res = await app.fetch(req, mockEnv(), createTestContext())
      expect(res.status).toBe(200)
    })
  })
})
```

## Vitest Config Notes
`vitest.config.ts` uses the Workers pool and verbose reporting.

## Test Output
Logs are silenced in tests by default using:
```ts
mockEnv({ LOG_LEVEL: "silent" })
```

## Debugging
Run a single file:
```bash
pnpm vitest run src/routes/v1/health.test.ts
```

Run a single test:
```bash
pnpm vitest run -t "should return healthy status"
```

Debug mode:
```bash
node --inspect-brk ./node_modules/.bin/vitest
```

## Common Issues
better-sqlite3 errors in Workers tests:
- Use dynamic imports in adapters (already in place)
- Prefer D1 in the Workers environment

Flaky tests:
- Avoid shared state
- Use `beforeEach` instead of `beforeAll`

## Improvements Backlog
- Add security headers and CORS middleware tests
- Add contract tests for API responses
- Add performance tests for latency thresholds
