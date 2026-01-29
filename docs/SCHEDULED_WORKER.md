# Extension Worker Mode - Scheduled Tasks Integration

This document explains how to integrate the scheduled worker with TanStack Start for Extension Worker Mode.

## Overview

The scheduled worker handles three types of cron-triggered tasks:

- **Every 6 hours**: Expire access grants and requests
- **Daily at midnight**: Send expiration warnings
- **Daily at 9 AM**: Run outbreak detection

## Configuration

### 1. Wrangler Configuration

The `wrangler.jsonc` has been updated with cron triggers:

```jsonc
"triggers": {
  "crons": [
    "0 */6 * * *",  // Every 6 hours - expire access grants/requests
    "0 0 * * *",    // Daily at midnight - expiration warnings
    "0 9 * * *"     // Daily at 9 AM - outbreak detection
  ]
}
```

### 2. TanStack Start Integration

Since TanStack Start uses `@tanstack/react-start/server-entry` as the main entry point, you need to create a custom entry point that handles both HTTP requests and scheduled events.

#### Option A: Custom Entry Point (Recommended)

Create `app/worker-entry.ts`:

```typescript
import { handleScheduled } from '~/features/extension/scheduled'

// Import TanStack Start's default handler
import { default as startHandler } from '@tanstack/react-start/server-entry'

export default {
  // Handle HTTP requests with TanStack Start
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return startHandler.fetch(request, env, ctx)
  },

  // Handle scheduled events
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event, env))
  },
}
```

Then update `wrangler.jsonc`:

```jsonc
{
  "main": "./app/worker-entry.ts",
  // ... rest of config
}
```

#### Option B: Server Function Approach

Alternatively, create a server function that can be called manually or via webhook:

```typescript
// app/features/extension/server-scheduled.ts
import { createServerFn } from '@tanstack/react-start'
import { handleScheduled } from './scheduled'

export const runScheduledTasksFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      task: z.enum(['expire', 'warnings', 'outbreaks']),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth')
    await requireAuth() // Ensure only authenticated users can trigger

    const mockEvent = {
      cron:
        data.task === 'expire'
          ? '0 */6 * * *'
          : data.task === 'warnings'
            ? '0 0 * * *'
            : '0 9 * * *',
      scheduledTime: Date.now(),
    }

    await handleScheduled(mockEvent, process.env as any)
    return { success: true }
  })
```

## Scheduled Functions

### `expireAccessGrants(db)`

- Finds active access grants past their expiry date
- Updates status to 'expired'
- Creates audit log entries

### `expireAccessRequests(db)`

- Finds pending requests older than 30 days (configurable)
- Updates status to 'expired'
- Creates audit log entries

### `sendExpirationWarnings(db)`

- Finds grants expiring within 7 days (configurable)
- Creates notifications for extension agents
- Runs daily at midnight

### `runOutbreakDetectionTask(db)`

- Analyzes mortality data from past 7 days
- Identifies outbreak patterns by district/species
- Creates outbreak alerts for significant patterns
- Runs daily at 9 AM

## Environment Variables

Configure these in your Cloudflare Worker secrets:

```bash
# Access management
wrangler secret put ACCESS_REQUEST_EXPIRY_DAYS  # Default: 30
wrangler secret put ACCESS_GRANT_DEFAULT_DAYS   # Default: 90
wrangler secret put ACCESS_EXPIRY_WARNING_DAYS  # Default: 7

# Visit records
wrangler secret put VISIT_EDIT_WINDOW_HOURS     # Default: 24
```

## Testing

### Local Development

For local testing, you can call the scheduled functions directly:

```typescript
// In your test file
import { expireAccessGrants } from '~/features/extension/scheduled'
import { getDb } from '~/lib/db'

const db = await getDb()
await expireAccessGrants(db)
```

### Production Testing

Use the server function approach (Option B) to manually trigger scheduled tasks via API calls.

## Monitoring

The scheduled functions log their activities:

- Number of grants/requests expired
- Number of warnings sent
- Number of outbreak alerts created

Monitor these logs in the Cloudflare Workers dashboard under your worker's logs section.

## Error Handling

All scheduled functions include error handling:

- Errors are logged to console
- Failed tasks throw errors to trigger Cloudflare's retry mechanism
- Database transactions ensure data consistency

## Performance Considerations

- Outbreak detection queries are limited to batches with ≥50 animals
- District queries are limited to prevent timeouts
- Database connections use the async `getDb()` pattern for Workers compatibility
