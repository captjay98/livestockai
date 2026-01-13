---
description: 'Analyze test coverage and suggest improvements'
---

# Test Coverage Analysis

Analyze current test coverage and recommend improvements.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Testing**: Vitest + fast-check (property-based testing)
**Framework**: TanStack Start (React 19)

## Run Coverage Report

```bash
bun test --coverage
```

## Coverage Targets

| Category               | Target | Warning | Critical | Priority |
| ---------------------- | ------ | ------- | -------- | -------- |
| Financial Calculations | 100%   | <95%    | <90%     | Critical |
| Business Logic         | 90%+   | <80%    | <70%     | Critical |
| Server Functions       | 80%+   | <70%    | <60%     | High     |
| Utilities              | 80%+   | <70%    | <60%     | High     |
| UI Components          | 70%+   | <60%    | <50%     | Medium   |

## Analyze Coverage

### 1. Identify Uncovered Files

```bash
# List files with low coverage
bun test --coverage --reporter=text
```

### 2. Critical Paths to Test

**Financial Calculations** (Must be 100%):

- Profit/loss calculations
- FCR calculations
- Cost per unit calculations
- Currency formatting

**Growth Forecasting**:

- Weight projections
- Days to harvest
- Growth curve calculations

**Batch Management**:

- Mortality rate calculations
- Stock quantity updates
- Status transitions

### 3. Server Functions

```typescript
// Test pattern for server functions
describe('getBatches', () => {
  it('returns batches for farm', async () => {
    const result = await getBatches({ farmId: 'test-farm-id' })
    expect(result).toBeInstanceOf(Array)
  })

  it('filters by status', async () => {
    const result = await getBatches({
      farmId: 'test-farm-id',
      status: 'active',
    })
    expect(result.every((b) => b.status === 'active')).toBe(true)
  })
})
```

## Test Types Needed

### Unit Tests

```typescript
// app/lib/finance/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculateProfit, calculateFCR } from './calculations'

describe('calculateProfit', () => {
  it('calculates profit correctly', () => {
    expect(calculateProfit(10000, 6000)).toBe(4000)
  })

  it('handles zero revenue', () => {
    expect(calculateProfit(0, 1000)).toBe(-1000)
  })
})
```

### Property-Based Tests

```typescript
// For mathematical operations
import * as fc from 'fast-check'

describe('calculateFCR', () => {
  it('is always positive for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.nat({ min: 1 }),
        fc.nat({ min: 1 }),
        (feed, weight) => calculateFCR(feed, weight) > 0,
      ),
    )
  })

  it('increases with more feed', () => {
    fc.assert(
      fc.property(
        fc.nat({ min: 1, max: 1000 }),
        fc.nat({ min: 1, max: 100 }),
        (baseFeed, weight) => {
          const fcr1 = calculateFCR(baseFeed, weight)
          const fcr2 = calculateFCR(baseFeed + 100, weight)
          return fcr2 > fcr1
        },
      ),
    )
  })
})
```

### Integration Tests

```typescript
// Test server function with database
describe('createBatch', () => {
  it('creates batch and returns id', async () => {
    const batch = await createBatch({
      farmId: 'test-farm',
      batchName: 'Test Batch',
      species: 'Broiler',
      initialQuantity: 1000,
    })

    expect(batch.id).toBeDefined()
    expect(batch.batchName).toBe('Test Batch')
  })
})
```

## Coverage Improvement Plan

### Phase 1: Critical (Week 1)

- [ ] Financial calculations: 100%
- [ ] Growth calculations: 90%
- [ ] Currency formatting: 100%

### Phase 2: High Priority (Week 2)

- [ ] Server functions: 80%
- [ ] Batch management: 85%
- [ ] Authentication: 80%

### Phase 3: Medium Priority (Week 3)

- [ ] UI components: 70%
- [ ] Form validation: 80%
- [ ] Utilities: 80%

## Test File Structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── finance/
│   │   │   ├── calculations.test.ts
│   │   │   └── currency.test.ts
│   │   ├── growth/
│   │   │   └── forecast.test.ts
│   │   └── batches/
│   │       └── calculations.test.ts
│   └── components/
│       └── BatchCard.test.tsx
├── integration/
│   ├── server/
│   │   ├── batches.test.ts
│   │   └── sales.test.ts
│   └── database/
│       └── migrations.test.ts
└── e2e/
    ├── auth.test.ts
    └── batch-workflow.test.ts
```

## Output Report

```markdown
# Test Coverage Report

## Summary

- **Overall Coverage**: X%
- **Status**: 🟢 Good / 🟡 Warning / 🔴 Critical

## Coverage by Category

| Category               | Coverage | Target | Status   |
| ---------------------- | -------- | ------ | -------- |
| Financial Calculations | X%       | 100%   | ✅/⚠️/❌ |
| Business Logic         | X%       | 90%    | ✅/⚠️/❌ |
| Server Functions       | X%       | 80%    | ✅/⚠️/❌ |
| Utilities              | X%       | 80%    | ✅/⚠️/❌ |
| UI Components          | X%       | 70%    | ✅/⚠️/❌ |

## Uncovered Critical Paths

1. [File/function with low coverage]
2. [File/function with low coverage]

## Recommendations

1. [Priority test to add]
2. [Priority test to add]
```

## Agent Delegation

- `@qa-engineer` - Test implementation and coverage improvement
- `@backend-engineer` - Server function testing

## Related Prompts

- `@code-review` - Review test quality
- `@execute` - Implement recommended tests

```markdown
# Test Coverage Report

## Summary

- **Overall Coverage**: X%
- **Target**: 80%
- **Status**: [Met/Not Met]

## Coverage by Category

| Category         | Current | Target | Gap |
| ---------------- | ------- | ------ | --- |
| Financial        | X%      | 100%   | X%  |
| Growth           | X%      | 90%    | X%  |
| Server Functions | X%      | 80%    | X%  |
| Components       | X%      | 70%    | X%  |

## Uncovered Critical Paths

1. [Function/file needing tests]
2. [Function/file needing tests]

## Recommended Tests to Add

1. [Specific test description]
2. [Specific test description]
3. [Specific test description]

## Estimated Effort

- Critical tests: X hours
- High priority: X hours
- Medium priority: X hours
```
