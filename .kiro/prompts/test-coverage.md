---
description: 'Analyze test coverage and suggest improvements'
---

# Test Coverage Analysis

Analyze current test coverage and recommend improvements.

## Context

**Project**: LivestockAI - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Testing**: Vitest + fast-check (property-based testing)
**Framework**: TanStack Start (React 19)
**Database**: PostgreSQL (Neon) + Kysely ORM
**Deployment**: Cloudflare Workers

## Step 0: Determine Analysis Scope

**Ask user interactively:**

> What test coverage analysis would you like?
>
> 1. **Full coverage report** - All files and categories
> 2. **Specific category** - Financial, business logic, server functions, etc.
> 3. **Specific feature** - Test coverage for one feature area
> 4. **Gap analysis** - Find critical untested code
> 5. **Improvement plan** - Prioritized list of tests to add

**Then ask about priority:**

- Critical paths only (financial, auth, data integrity)
- All business logic
- Include UI components
- Full codebase

Wait for response before proceeding.

## Step 1: Run Coverage Report

```bash
bun run test --coverage
```

**Error handling:**

- If command fails: "Test runner not configured. Run `bun install` first."
- If no tests found: "No test files found. Check tests/ directory exists."
- If tests fail: "Some tests failing. Fix failures before analyzing coverage? (y/n)"

**If tests fail, ask:**

> Tests are failing. What would you like to do?
>
> - (f) Fix failing tests first
> - (s) Skip failing tests and analyze coverage
> - (v) View failing test details

## Step 2: Analyze Coverage Results

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
bun run test --coverage --reporter=text
```

### 2. Critical Paths to Test

**Financial Calculations** (Must be 100%):

- Profit/loss calculations
- FCR calculations
- Cost per unit calculations
- Multi-currency formatting (useFormatCurrency)
- Currency conversion utilities

**Growth Forecasting**:

- Weight projections
- Days to harvest
- Growth curve calculations

**Batch Management**:

- Mortality rate calculations
- Stock quantity updates
- Status transitions

**Error Handling**:

- AppError creation and handling
- Error code validation
- i18n error messages

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
// app/features/finance/calculations.test.ts
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
    const batch = await createBatch('user-id', {
      farmId: 'test-farm',
      livestockType: 'poultry',
      species: 'Broiler',
      initialQuantity: 1000,
      acquisitionDate: new Date(),
      costPerUnit: 500,
    })

    expect(batch).toBeDefined()
  })

  it('throws AppError for invalid farm access', async () => {
    await expect(
      createBatch('wrong-user', {
        farmId: 'test-farm',
        livestockType: 'poultry',
        species: 'Broiler',
        initialQuantity: 1000,
        acquisitionDate: new Date(),
        costPerUnit: 500,
      }),
    ).rejects.toThrow('ACCESS_DENIED')
  })
})
```

## Coverage Improvement Plan

### Phase 1: Critical (Week 1)

- [ ] Financial calculations: 100%
- [ ] Growth calculations: 90%
- [ ] Multi-currency formatting: 100%
- [ ] AppError handling: 90%

### Phase 2: High Priority (Week 2)

- [ ] Server functions: 80%
- [ ] Batch management: 85%
- [ ] Authentication: 80%
- [ ] i18n integration: 75%

### Phase 3: Medium Priority (Week 3)

- [ ] UI components: 70%
- [ ] Form validation: 80%
- [ ] Utilities: 80%
- [ ] Notification system: 75%

## Test File Structure

```
tests/
├── features/
│   ├── batches/
│   │   ├── batches.test.ts
│   │   ├── batches.property.test.ts
│   │   └── batches.integration.test.ts
│   ├── finance/
│   │   ├── calculations.test.ts
│   │   └── profit.property.test.ts
│   ├── settings/
│   │   ├── currency.test.ts
│   │   └── currency.property.test.ts
│   └── monitoring/
│       └── mortality.property.test.ts
└── components/
    └── dialogs/
        └── batch-dialog.test.tsx
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

For comprehensive test coverage improvement:

- `@qa-engineer` - Test implementation, coverage improvement, and testing strategies
- `@backend-engineer` - Server function testing and database integration tests
- `@frontend-engineer` - Component testing and UI interaction tests
- `@security-engineer` - Security testing and vulnerability coverage

### When to Delegate

- **Test implementation** - @qa-engineer for writing tests and improving coverage
- **Server functions** - @backend-engineer for database and API testing
- **UI components** - @frontend-engineer for React component tests
- **Security** - @security-engineer for auth and security test coverage

## Related Prompts

- `@code-review` - Review test quality and effectiveness
- `@execute` - Implement recommended tests
- `@plan-feature` - Include test requirements in feature plans

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

## Validation & Next Steps

**Validate coverage analysis:**

1. **Verify accuracy:**
   - Coverage percentages match test output
   - All critical files identified
   - No false positives (commented code counted as uncovered)

2. **Check priorities:**
   - Critical paths identified correctly
   - Effort estimates realistic
   - Dependencies considered

**Ask user:**

> Coverage analysis complete. What would you like to do?
>
> - (i) Implement top 3 recommended tests
> - (p) Create detailed test plan
> - (r) Re-run after adding tests
> - (e) Export coverage report

**If coverage is low (<80%):**

> Coverage is below target. Recommended approach:
>
> 1. Start with critical financial calculations (must be 100%)
> 2. Add business logic tests (target 90%)
> 3. Cover server functions (target 80%)
>
> Proceed with this plan? (y/n)

**Success criteria:**

- All critical paths have 100% coverage
- Overall coverage meets 80% target
- No untested financial calculations
- Integration tests for database operations
