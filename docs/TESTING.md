# Testing Guide

Comprehensive testing strategies for OpenLivestock Manager.

---

## Testing Philosophy

OpenLivestock uses a **multi-layered testing approach**:

1. **Property-based tests** - Mathematical correctness (fast-check)
2. **Unit tests** - Business logic validation (Vitest)
3. **Integration tests** - Database operations (Vitest + Neon)
4. **Component tests** - UI behavior (Testing Library)
5. **E2E tests** - Critical user flows (Playwright - future)

---

## Quick Start

```bash
# Run all tests
bun run test

# Run with coverage
bun run test --coverage

# Run specific test file
bun run test tests/features/batches/batches.property.test.ts

# Watch mode
bun run test --watch
```

---

## Test Structure

```
tests/
├── features/                  # Feature-specific tests
│   ├── batches/
│   │   ├── batches.test.ts           # Unit tests
│   │   ├── batches.property.test.ts  # Property tests
│   │   └── batches.integration.test.ts # Integration tests
│   ├── finance/
│   │   ├── profit.property.test.ts
│   │   └── fcr.property.test.ts
│   └── notifications/
│       ├── notifications.test.ts
│       ├── notifications.property.test.ts
│       └── notifications.integration.test.ts
└── setup.ts                   # Test setup and utilities
```

---

## Property-Based Testing

### What is Property-Based Testing?

Instead of testing specific examples, we test **properties that should always be true**:

```typescript
// ❌ Example-based test
expect(calculateProfit(1000, 600)).toBe(400)

// ✅ Property-based test
fc.assert(
  fc.property(fc.nat(), fc.nat(), (revenue, costs) => {
    const profit = calculateProfit(revenue, costs)
    expect(profit).toBe(revenue - costs) // Always true
  }),
)
```

### When to Use Property Tests

Use property tests for:

- **Mathematical operations** (profit, FCR, mortality rate)
- **Data transformations** (currency conversion, unit conversion)
- **Invariants** (sorted lists stay sorted, totals match sums)
- **Idempotency** (applying operation twice = applying once)

### Example: FCR Calculation

```typescript
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('Feed Conversion Ratio', () => {
  it('should always be feed / weight gain', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.1, max: 1000 }), // feed kg
        fc.float({ min: 0.1, max: 100 }), // weight gain kg
        (feed, weightGain) => {
          const fcr = calculateFCR(feed, weightGain)
          expect(fcr).toBeCloseTo(feed / weightGain, 2)
        },
      ),
      { numRuns: 1000 }, // Test 1000 random combinations
    )
  })

  it('should be undefined when weight gain is zero', () => {
    fc.assert(
      fc.property(fc.float({ min: 0.1 }), (feed) => {
        expect(calculateFCR(feed, 0)).toBeUndefined()
      }),
    )
  })

  it('should increase when feed increases', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 100 }),
        fc.float({ min: 0.1, max: 10 }),
        (feed, weightGain) => {
          const fcr1 = calculateFCR(feed, weightGain)
          const fcr2 = calculateFCR(feed * 2, weightGain)
          expect(fcr2).toBeGreaterThan(fcr1!)
        },
      ),
    )
  })
})
```

### Property Test Patterns

**1. Inverse Operations**

```typescript
// Encoding/decoding should be inverse
fc.assert(
  fc.property(fc.string(), (str) => {
    expect(decode(encode(str))).toBe(str)
  }),
)
```

**2. Idempotency**

```typescript
// Sorting twice = sorting once
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const sorted1 = sort(arr)
    const sorted2 = sort(sorted1)
    expect(sorted2).toEqual(sorted1)
  }),
)
```

**3. Invariants**

```typescript
// Sum of parts = total
fc.assert(
  fc.property(fc.array(fc.nat()), (numbers) => {
    const total = sum(numbers)
    expect(total).toBe(numbers.reduce((a, b) => a + b, 0))
  }),
)
```

**4. Commutativity**

```typescript
// Order doesn't matter
fc.assert(
  fc.property(fc.nat(), fc.nat(), (a, b) => {
    expect(add(a, b)).toBe(add(b, a))
  }),
)
```

---

## Unit Testing

### Server Functions

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createBatch, getBatches } from '~/features/batches/server'

describe('Batch Server Functions', () => {
  beforeEach(async () => {
    // Clean database
    await db.deleteFrom('batches').execute()
  })

  it('should create a batch', async () => {
    const batchId = await createBatch('user-id', {
      farmId: 'farm-id',
      livestockType: 'poultry',
      species: 'broiler',
      initialQuantity: 100,
      acquisitionDate: new Date(),
      costPerUnit: 500,
    })

    expect(batchId).toBeDefined()
  })

  it('should get batches for user', async () => {
    await createBatch('user-id', {
      /* ... */
    })

    const batches = await getBatches('user-id', 'farm-id')

    expect(batches).toHaveLength(1)
    expect(batches[0].species).toBe('broiler')
  })
})
```

### Utilities

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '~/features/settings/currency'

describe('Currency Formatting', () => {
  it('should format USD correctly', () => {
    const result = formatCurrency(1234.56, {
      currencyCode: 'USD',
      currencySymbol: '$',
      currencyDecimals: 2,
      currencySymbolPosition: 'before',
      thousandSeparator: ',',
      decimalSeparator: '.',
    })

    expect(result).toBe('$1,234.56')
  })

  it('should format NGN correctly', () => {
    const result = formatCurrency(1234.56, {
      currencyCode: 'NGN',
      currencySymbol: '$',
      currencyDecimals: 2,
      currencySymbolPosition: 'before',
      thousandSeparator: ',',
      decimalSeparator: '.',
    })

    expect(result).toBe('$1,234.56')
  })
})
```

---

## Integration Testing

### Database Operations

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '~/lib/db'

describe('Batch Integration Tests', () => {
  let userId: string
  let farmId: string

  beforeAll(async () => {
    // Create test user and farm
    const user = await db
      .insertInto('users')
      .values({ email: 'test@example.com', name: 'Test' })
      .returning('id')
      .executeTakeFirstOrThrow()
    userId = user.id

    const farm = await db
      .insertInto('farms')
      .values({ name: 'Test Farm', location: 'Test', type: 'poultry' })
      .returning('id')
      .executeTakeFirstOrThrow()
    farmId = farm.id

    await db
      .insertInto('user_farms')
      .values({ userId, farmId, role: 'owner' })
      .execute()
  })

  afterAll(async () => {
    // Cleanup
    await db.deleteFrom('user_farms').where('userId', '=', userId).execute()
    await db.deleteFrom('farms').where('id', '=', farmId).execute()
    await db.deleteFrom('users').where('id', '=', userId).execute()
  })

  it('should create batch and update quantity on mortality', async () => {
    // Create batch
    const batch = await db
      .insertInto('batches')
      .values({
        farmId,
        livestockType: 'poultry',
        species: 'broiler',
        initialQuantity: 100,
        currentQuantity: 100,
        acquisitionDate: new Date(),
        costPerUnit: '500',
        totalCost: '50000',
        status: 'active',
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    // Record mortality
    await db
      .insertInto('mortality_records')
      .values({
        batchId: batch.id,
        quantity: 5,
        date: new Date(),
        cause: 'disease',
      })
      .execute()

    // Update batch quantity
    await db
      .updateTable('batches')
      .set({ currentQuantity: 95 })
      .where('id', '=', batch.id)
      .execute()

    // Verify
    const updated = await db
      .selectFrom('batches')
      .select('currentQuantity')
      .where('id', '=', batch.id)
      .executeTakeFirstOrThrow()

    expect(updated.currentQuantity).toBe(95)
  })
})
```

---

## Component Testing

### React Components

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchDialog } from '~/components/dialogs/batch-dialog'

describe('BatchDialog', () => {
  it('should render form fields', () => {
    render(<BatchDialog open={true} onOpenChange={() => {}} />)

    expect(screen.getByLabelText(/species/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn()

    render(<BatchDialog open={true} onOpenChange={() => {}} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/species/i), {
      target: { value: 'broiler' }
    })
    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: '100' }
    })

    fireEvent.click(screen.getByText(/create batch/i))

    expect(onSubmit).toHaveBeenCalledWith({
      species: 'broiler',
      initialQuantity: 100,
      // ...
    })
  })
})
```

---

## Test Coverage

### Current Coverage

```bash
bun run test --coverage
```

**Target Coverage:**

- **Business Logic**: 90%+
- **Server Functions**: 85%+
- **Components**: 75%+
- **Overall**: 80%+

### Coverage by Feature

| Feature       | Unit   | Property | Integration | Total  |
| ------------- | ------ | -------- | ----------- | ------ |
| Batches       | ✅ 90% | ✅ 100%  | ✅ 85%      | ✅ 92% |
| Finance       | ✅ 95% | ✅ 100%  | ⚠️ 70%      | ✅ 88% |
| Notifications | ✅ 85% | ✅ 100%  | ✅ 80%      | ✅ 88% |
| Settings      | ⚠️ 75% | ✅ 90%   | ⚠️ 65%      | ⚠️ 77% |

---

## Testing Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Testing implementation
expect(component.state.isLoading).toBe(true)

// ✅ Testing behavior
expect(screen.getByText(/loading/i)).toBeInTheDocument()
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Vague
it('works', () => {
  /* ... */
})

// ✅ Descriptive
it('should calculate FCR as feed divided by weight gain', () => {
  /* ... */
})
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should create batch', async () => {
  // Arrange
  const data = { species: 'broiler', quantity: 100 }

  // Act
  const batchId = await createBatch('user-id', data)

  // Assert
  expect(batchId).toBeDefined()
})
```

### 4. Test Edge Cases

```typescript
it('should handle zero quantity', () => {
  expect(calculateFCR(100, 0)).toBeUndefined()
})

it('should handle negative numbers', () => {
  expect(() => calculateFCR(-100, 10)).toThrow()
})
```

### 5. Use Test Fixtures

```typescript
// tests/fixtures/batches.ts
export const mockBatch = {
  id: 'batch-1',
  farmId: 'farm-1',
  species: 'broiler',
  initialQuantity: 100,
  currentQuantity: 95,
  status: 'active',
}

// In tests
import { mockBatch } from '../fixtures/batches'
```

---

## Continuous Integration

### GitHub Actions

`.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Debugging Tests

### Run Single Test

```bash
bun run test -t "should calculate FCR"
```

### Debug Mode

```typescript
import { describe, it, expect } from 'vitest'

describe('Debug Test', () => {
  it.only('should debug this test', () => {
    // .only runs only this test
    console.log('Debug output')
    expect(true).toBe(true)
  })
})
```

### Inspect Database State

```typescript
it('should create batch', async () => {
  await createBatch('user-id', data)

  // Inspect database
  const batches = await db.selectFrom('batches').selectAll().execute()
  console.log('Batches:', batches)

  expect(batches).toHaveLength(1)
})
```

---

## Performance Testing

### Benchmark Tests

```typescript
import { describe, it, expect } from 'vitest'
import { performance } from 'perf_hooks'

describe('Performance', () => {
  it('should calculate FCR in < 1ms', () => {
    const start = performance.now()

    for (let i = 0; i < 1000; i++) {
      calculateFCR(100, 10)
    }

    const duration = performance.now() - start
    expect(duration).toBeLessThan(1)
  })
})
```

---

## Future: E2E Testing

### Playwright Setup (Planned)

```typescript
import { test, expect } from '@playwright/test'

test('user can create batch', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // Login
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Create batch
  await page.click('text=Add Batch')
  await page.fill('[name="species"]', 'broiler')
  await page.fill('[name="quantity"]', '100')
  await page.click('text=Create Batch')

  // Verify
  await expect(page.locator('text=broiler')).toBeVisible()
})
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Testing Library](https://testing-library.com/)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)

---

**Last Updated**: January 15, 2026
