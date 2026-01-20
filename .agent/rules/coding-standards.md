---
description: OpenLivestock coding standards and mandatory patterns
---

# Coding Standards

## Server Functions

All database operations MUST use TanStack Start server functions with dynamic imports:

```typescript
// ✅ Correct pattern
export const getData = createServerFn({ method: 'GET' })
  .validator(schema)
  .handler(async ({ data }) => {
    const { db } = await import('../db')
    return db.selectFrom('table').execute()
  })

// ❌ Never do this - breaks Cloudflare Workers
import { db } from '../db'
```

## Database Queries

- Use explicit column selection (no `SELECT *`)
- Use Kysely's type-safe query builder
- camelCase for database columns

## Currency & i18n

- Always use `useFormatCurrency()` hook
- Always use `useTranslation()` hook
- Never hardcode currency symbols or user-facing strings

## Error Handling

- Use `AppError` from `~/lib/errors` with typed error codes
- Use `requireAuth()` and `checkFarmAccess()` for protected operations
