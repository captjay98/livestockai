# Cloudflare Development Guide

## Overview

OpenLivestock Manager is deployed on Cloudflare Workers. This guide covers Workers-specific patterns and best practices.

## MCP Servers Available

| Server                     | Purpose                     |
| -------------------------- | --------------------------- |
| `cloudflare-bindings`      | Manage Workers and bindings |
| `cloudflare-builds`        | Deployment status and logs  |
| `cloudflare-observability` | Worker logs and debugging   |
| `cloudflare-docs`          | Documentation search        |

## Workers Patterns

### Database Access (CRITICAL)

Cloudflare Workers does NOT support `process.env`. You MUST use the async `getDb()` function:

```typescript
// ✅ Correct - works on Cloudflare Workers
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  return db.selectFrom('table').execute()
})

// ❌ Wrong - breaks on Cloudflare (process.env not available)
import { db } from '~/lib/db'

// ❌ Also wrong - old pattern
const { db } = await import('~/lib/db')
```

**Why?** Cloudflare Workers uses `env` bindings from `cloudflare:workers` instead of `process.env`. The `getDb()` function handles this automatically.

### Environment Variables

In Cloudflare Workers, env vars come from `.dev.vars` (local) or wrangler secrets (production):

```bash
# Local development - create .dev.vars file
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3001

# Production - set via wrangler
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
```

## Deployment

### Manual Deployment

```bash
bun run deploy
# or
wrangler deploy
```

### Via MCP

Use cloudflare-builds server to trigger deployments directly.

## Debugging

### View Logs

```bash
wrangler tail
```

### Via MCP

Use cloudflare-observability server to search and filter logs.

### Common Issues

1. **"Cannot find module" errors**
   - Use dynamic imports for database connections
   - Check that all Node.js APIs are polyfilled

2. **Cold start latency**
   - Minimize bundle size

3. **Memory limits**
   - Workers have 128MB memory limit
   - Stream large responses instead of buffering
