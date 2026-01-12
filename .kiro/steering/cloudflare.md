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

### Dynamic Imports (CRITICAL)

All database and heavy imports MUST be dynamic inside server functions:

```typescript
// ✅ Correct - works on Cloudflare
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  const { db } = await import('../db')
  return db.selectFrom('table').execute()
})

// ❌ Wrong - breaks on Cloudflare
import { db } from '../db'
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  return db.selectFrom('table').execute()
})
```

### Environment Variables

Access via `process.env` in server functions:

```typescript
const apiKey = process.env.API_KEY
```

Set secrets via wrangler:

```bash
wrangler secret put API_KEY
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
