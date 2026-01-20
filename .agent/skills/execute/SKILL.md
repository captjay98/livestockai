---
name: Execute
description: Execute implementation plans with OpenLivestock-specific patterns
---

# Execute

Transform an implementation plan into working code for OpenLivestock Manager.

## When to Use

- After a feature plan has been created
- When implementing from a detailed specification
- When you have a plan file in `.agents/plans/`

## Prerequisites

- Plan file exists and is readable
- Dependencies installed (`bun install`)
- Database accessible

## Process

### 1. Read the Plan

- Locate plan file (check `.agents/plans/`)
- Extract files to create/modify
- Identify dependencies between tasks

### 2. Execute Tasks (In Order)

**Server Functions:**

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getData = createServerFn({ method: 'GET' })
  .validator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db') // CRITICAL: Dynamic import!
    return db.selectFrom('batches').execute()
  })
```

**Components:**

```typescript
import { useTranslation } from 'react-i18next'
import { useFormatCurrency } from '~/features/settings'

const { t } = useTranslation(['feature', 'common'])
const { format: formatCurrency } = useFormatCurrency()
```

### 3. Validate After Each Change

```bash
bun run lint --fix
bun run check
```

### 4. Final Validation

```bash
bun run lint && bun run check && bun test && bun run build
```

## Key Tables

| Table               | Purpose           |
| ------------------- | ----------------- |
| `batches`           | Livestock batches |
| `mortality_records` | Death tracking    |
| `feed_records`      | Feed consumption  |
| `sales`             | Revenue records   |
| `expenses`          | Cost tracking     |
| `farms`             | Farm entities     |

## Success Criteria

- All tasks from plan completed
- `bun run check` passes (no type errors)
- `bun test` passes
- `bun run build` succeeds
