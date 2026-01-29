# Testing Guidelines

## Integration Tests

### Test Isolation

- Integration tests MUST run sequentially (not in parallel) to avoid database conflicts
- Use `fileParallelism: false` in vitest config for integration tests
- The main `vitest.config.ts` excludes `**/*.integration.test.ts` - these run with `vitest.integration.config.ts`

### Database Connection Management

- Use `truncateAllTables()` in `beforeEach()` to reset database state
- Use `resetTestDb()` in `afterEach()` to clear transaction state without destroying connection
- Use `closeTestDb()` in `afterAll()` to properly close the connection at the end of the test suite
- NEVER call `closeTestDb()` in `afterEach()` - this destroys the connection and causes subsequent tests to fail

### Unique Test Data

- Always use unique identifiers for test data (e.g., `email: \`test-${Date.now()}@example.com\``)
- This prevents "duplicate key" errors when tests run in sequence and truncation hasn't completed

### Example Integration Test Structure

```typescript
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  resetTestDb,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'

describe('My Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should do something', async () => {
    const { userId } = await seedTestUser({
      email: `test-${Date.now()}@example.com`,
    })
    // ... test code
  })
})
```

## Property-Based Tests (fast-check)

### Date Generators

- Always use `noInvalidDate: true` to prevent `new Date(NaN)` from being generated
- Example: `fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01'), noInvalidDate: true })`

### Geographic Coordinates

- For bounding box tests, constrain longitude to avoid international date line edge cases
- Use `fc.double({ min: -170, max: 170, noNaN: true })` instead of full `-180` to `180` range
- The bounding box calculation doesn't handle date line wrap-around (acceptable for regional marketplace use case)

### Number Generators

- Always use `noNaN: true` for double generators to avoid NaN values breaking calculations
- Example: `fc.double({ min: 0.01, max: 1000, noNaN: true })`

## Running Tests

```bash
# Run unit/property tests only (fast, no database)
bun run test

# Run integration tests only (requires DATABASE_URL_TEST)
bun run test:integration

# Run all tests
bun run test:all
```
