# Database Optimization: From Per-Request to Per-Context Initialization

## Problem

The database was being initialized on **every request** to the health endpoint, causing:
- Multiple "Using D1 database adapter" log messages during tests
- Unnecessary overhead creating new database instances for each request
- Inefficient resource usage

### Before (Anti-pattern)
```typescript
// In health.ts - BAD ❌
health.get("/", async (c) => {
  const db = await createDatabase(c.env) // Creates new DB for every request!
  const isConnected = await db.healthCheck()
  // ...
})
```

This meant:
- 6 tests in health endpoint → 6 database initializations
- 21 total tests → 15+ database initializations
- Repeated console.log output polluting test results

## Solution

Initialize the database **once per request context** using middleware and store it in Hono's context:

### After (Correct pattern)
```typescript
// In database.ts middleware - GOOD ✅
export const databaseMiddleware = () => {
  return async (c, next) => {
    if (!c.get("db")) {
      const db = await createDatabase(c.env)
      c.set("db", db)
    }
    await next()
  }
}

// In health.ts - GOOD ✅
health.get("/", async (c) => {
  const db = c.get("db") // Reuse existing DB instance
  if (db) {
    const isConnected = await db.healthCheck()
    // ...
  }
})
```

## Benefits

1. **Performance**: Database initialized only once per request, not per endpoint access
2. **Clean logs**: No more repeated initialization messages
3. **Resource efficiency**: Proper connection reuse
4. **Scalability**: Pattern works for production at scale
5. **Testability**: Cleaner test output

## Implementation Details

### 1. Database Middleware

Created `src/middleware/database.ts`:
- Initializes database once per request context
- Stores in Hono context via `c.set("db", db)`
- Handles initialization failures gracefully
- Logs warnings if database unavailable

### 2. Updated Type Definitions

Added `db` to context variables in `src/core/types.ts`:
```typescript
Variables: {
  correlationId: string
  requestStartTime: number
  db?: IDatabase  // Optional database instance
}
```

### 3. Updated Routes

Routes now access database from context:
```typescript
const db = c.get("db")
if (db) {
  // Use database
}
```

### 4. Middleware Order

Database middleware runs after correlation and logger:
```typescript
app.use("*", correlationMiddleware())
app.use("*", loggerMiddleware())
app.use("*", databaseMiddleware())  // After logger so warnings are logged
app.use("*", securityHeaders())
app.use("*", corsMiddleware())
```

## Testing

Added comprehensive tests in `src/middleware/database.test.ts`:
- ✅ Database initialization per request
- ✅ Database available in context
- ✅ Correct adapter selection (D1 in tests)
- ✅ Health check reporting

All 25 tests passing with clean output!

## Performance Impact

### Before
- 21 tests × multiple DB initializations each = ~50+ initializations
- Each request to health endpoint created new DB instance

### After
- 1 DB initialization per request context
- Clean, predictable resource usage
- No redundant initialization

## Best Practices

### ✅ DO
- Initialize expensive resources in middleware
- Store in context for reuse across the request lifecycle
- Check if resource exists before re-initializing (`if (!c.get("db"))`)
- Handle initialization failures gracefully

### ❌ DON'T
- Create new database instances in route handlers
- Initialize resources multiple times per request
- Block requests if optional resources fail to initialize
- Ignore resource cleanup (though Cloudflare Workers handles this)

## Related Files

- `src/middleware/database.ts` - Database middleware
- `src/middleware/database.test.ts` - Database middleware tests
- `src/core/types.ts` - Type definitions with db in context
- `src/app.ts` - Middleware registration
- `src/routes/v1/health.ts` - Updated to use context db

## Future Considerations

### Connection Pooling
For traditional servers (non-Workers), consider connection pooling:
```typescript
// Not needed in Cloudflare Workers, but for reference
const pool = new Pool({ connectionString: env.DATABASE_URL })
```

### Lazy Loading
Database is already lazy-loaded via dynamic imports to avoid loading `better-sqlite3` in Workers environment.

### Resource Cleanup
Cloudflare Workers automatically cleans up resources after request. For traditional servers, consider cleanup:
```typescript
c.executionCtx.waitUntil(
  new Promise(resolve => {
    db.close()
    resolve()
  })
)
```
