# Testing Guide

## Overview

This project uses Vitest with Cloudflare Workers test environment for comprehensive testing.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

Tests follow a nested `describe` structure for better organization:

```typescript
describe("Feature Name", () => {
  let app: Hono

  beforeAll(() => {
    app = createApp()
  })

  describe("Specific Aspect", () => {
    it("should do something specific", async () => {
      // Arrange
      const req = createTestRequest("http://localhost/api/endpoint")
      
      // Act
      const res = await app.fetch(req, mockEnv(), createTestContext())
      
      // Assert
      expect(res.status).toBe(200)
    })
  })
})
```

## Test Utilities

The `src/lib/test-utils.ts` file provides helper functions:

- `createTestRequest(url, init?)` - Create test requests
- `mockEnv(overrides?)` - Create mock environment bindings
- `createTestContext()` - Create mock execution context
- `getResponseJson<T>(response)` - Extract JSON from responses
- `isValidUUIDv4(uuid)` - Validate UUID v4 format

## Best Practices

### 1. Use Nested Describes

Organize tests with nested describe blocks for better hierarchy:

```typescript
describe("User API", () => {
  describe("POST /users", () => {
    it("should create user with valid data", () => {})
    it("should reject invalid email", () => {})
  })
  
  describe("GET /users/:id", () => {
    it("should return user by id", () => {})
    it("should return 404 for non-existent user", () => {})
  })
})
```

### 2. Setup and Teardown

Use lifecycle hooks for common setup:

```typescript
describe("Database Tests", () => {
  let db: IDatabase

  beforeAll(async () => {
    db = await createDatabase(mockEnv())
  })

  afterAll(async () => {
    await db.close()
  })
})
```

### 3. Test Names

Use descriptive test names that clearly state the expected behavior:

- ✅ Good: `"should return 404 when user not found"`
- ❌ Bad: `"test user endpoint"`

### 4. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it("should validate user input", async () => {
  // Arrange
  const invalidUser = { email: "invalid" }
  
  // Act
  const result = await validateUser(invalidUser)
  
  // Assert
  expect(result.valid).toBe(false)
  expect(result.errors).toContain("email")
})
```

### 5. Test One Thing

Each test should verify a single behavior:

```typescript
// ❌ Bad: Testing multiple things
it("should create and update user", async () => {
  const user = await createUser(data)
  const updated = await updateUser(user.id, newData)
  // ...
})

// ✅ Good: Separate tests
it("should create user", async () => {})
it("should update user", async () => {})
```

## Configuration

### Vitest Config

Key settings in `vitest.config.ts`:

```typescript
export default defineWorkersConfig({
  test: {
    reporters: ["verbose"],  // Shows describe/it structure
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
  },
})
```

### Silent Logging

Tests automatically suppress application logs by setting:

```typescript
mockEnv({ LOG_LEVEL: "silent" })
```

## Current Test Coverage

- ✅ Health endpoint tests
- ✅ Correlation ID middleware tests
- ✅ Error handler middleware tests
- ⏳ Security headers tests (partial)
- ⏳ CORS middleware tests (pending)
- ⏳ Route tests (pending)

## Future Improvements

### 1. Test Coverage

Add coverage reporting to identify untested code:

```bash
pnpm test:coverage
```

### 2. Integration Tests

Add integration tests for complex workflows:

```typescript
describe("User Registration Flow", () => {
  it("should complete full registration", async () => {
    // 1. Create user
    // 2. Verify email
    // 3. Login
    // 4. Access protected resource
  })
})
```

### 3. Performance Tests

Add tests to ensure response times:

```typescript
it("should respond within 100ms", async () => {
  const start = performance.now()
  await app.fetch(req, env, ctx)
  const duration = performance.now() - start
  expect(duration).toBeLessThan(100)
})
```

### 4. Contract Tests

Add schema validation for API responses:

```typescript
import { z } from "zod"

const HealthResponseSchema = z.object({
  status: z.literal("healthy"),
  version: z.string(),
  timestamp: z.string().datetime(),
})

it("should match health response schema", async () => {
  const res = await app.fetch(req, env, ctx)
  const data = await res.json()
  expect(() => HealthResponseSchema.parse(data)).not.toThrow()
})
```

### 5. Snapshot Tests

Use snapshot testing for complex responses:

```typescript
it("should match error response snapshot", async () => {
  const res = await app.fetch(req, env, ctx)
  const data = await res.json()
  expect(data).toMatchSnapshot()
})
```

### 6. Parallel Test Execution

Configure parallel execution for faster tests:

```typescript
export default defineWorkersConfig({
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
})
```

### 7. Test Factories

Create factories for common test data:

```typescript
// test/factories/user.factory.ts
export function createUserFactory(overrides?: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  }
}
```

### 8. Mock Services

Create mock implementations for external services:

```typescript
// test/mocks/email.service.ts
export class MockEmailService implements IEmailService {
  sentEmails: Email[] = []
  
  async send(email: Email): Promise<void> {
    this.sentEmails.push(email)
  }
}
```

## Debugging Tests

### Run Specific Test File

```bash
pnpm vitest run src/routes/v1/health.test.ts
```

### Run Specific Test

```bash
pnpm vitest run -t "should return healthy status"
```

### Debug Mode

Add `debugger` statements and run with:

```bash
node --inspect-brk ./node_modules/.bin/vitest
```

## Common Issues

### Issue: better-sqlite3 Errors

**Solution**: Use dynamic imports for database adapters to avoid loading in Cloudflare Workers environment.

### Issue: Tests Timeout

**Solution**: Increase timeout for slow tests:

```typescript
it("slow test", async () => {
  // test code
}, 10000) // 10 second timeout
```

### Issue: Flaky Tests

**Solution**: Ensure tests are isolated and don't depend on execution order:

```typescript
// Use beforeEach instead of beforeAll for test isolation
beforeEach(() => {
  // Reset state for each test
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
