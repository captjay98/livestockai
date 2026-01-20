---
name: Test Coverage
description: Improve test coverage for OpenLivestock
---

# Test Coverage

Analyze and improve test coverage.

## Current Test Command

```bash
bun test --coverage
```

## Coverage Goals

- Business logic: 80%+
- Server functions: 70%+
- Critical paths: 100%

## Priority Areas

### High Priority (Critical)

- Authentication flows
- Financial calculations
- Data integrity functions

### Medium Priority

- Server functions with business logic
- Form validations
- Currency/date formatting

### Lower Priority

- UI component rendering
- Static pages

## Adding Tests

### Unit Test

```typescript
// tests/unit/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculateFCR } from '~/lib/calculations'

describe('calculateFCR', () => {
  it('returns correct ratio', () => {
    expect(calculateFCR(100, 50)).toBe(2.0)
  })
})
```

### Property Test

```typescript
import { fc } from 'fast-check'

it('always positive for positive inputs', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.1 }),
      fc.float({ min: 0.1 }),
      (a, b) => calculateRatio(a, b) > 0,
    ),
  )
})
```

## Validation

```bash
bun test --coverage
```
