---
name: Code Review
description: Technical code review for OpenLivestock codebase
---

# Code Review

Perform thorough technical code review for OpenLivestock Manager.

## When to Use

- Before merging feature branches
- After completing implementation
- When reviewing pull requests

## Review Checklist

### 1. OpenLivestock Patterns

- [ ] Dynamic imports in server functions
- [ ] `AppError` for error handling
- [ ] `useFormatCurrency()` for currency display
- [ ] `useTranslation()` for user-facing strings
- [ ] `requireAuth()` and `checkFarmAccess()` for auth
- [ ] Kysely queries with explicit column selection

### 2. Type Safety

- [ ] No `any` types without justification
- [ ] Proper Zod validation on server function inputs
- [ ] Types updated in `app/lib/db/types.ts` if schema changed

### 3. Performance

- [ ] No SELECT \* in database queries
- [ ] Efficient joins and aggregations
- [ ] No unnecessary re-renders in components

### 4. Security

- [ ] Auth checks present on sensitive operations
- [ ] Input validation with Zod schemas
- [ ] No sensitive data in error messages

### 5. Testing

- [ ] Unit tests for business logic
- [ ] Property tests for calculations
- [ ] Integration tests for server functions

## Validation Commands

```bash
bun run lint
bun run check
bun test
bun run build
```

## Output Format

Provide:

1. Summary of review findings
2. List of issues (if any) with severity
3. Suggested improvements
4. Approval status (approved/needs changes)
