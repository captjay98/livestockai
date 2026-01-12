---
description: 'Debug Cloudflare Workers deployment issues'
---

# Debug Cloudflare Workers Issues

Systematic approach to debugging Cloudflare Workers deployment problems.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Deployment**: Cloudflare Workers (edge computing)
**Database**: Neon PostgreSQL (serverless)

## Quick Diagnosis with MCP

### Check Deployment Status

```
workers_list
workers_get_worker scriptName="openlivestock"
workers_builds_list_builds
```

### View Recent Errors

```
query_worker_observability (filter by error level)
observability_keys (find available log fields)
```

### Search Cloudflare Docs for Solutions

```
search_cloudflare_documentation query="workers runtime error"
search_cloudflare_documentation query="nodejs_compat"
```

## Common Issues & Solutions

### 1. Build Failures

**Symptom**: `bun run build` fails

**Check**:

```bash
# TypeScript errors
bun run check

# Missing dependencies
bun install
```

**Common causes**:

- Static imports of Node.js modules
- Missing type definitions
- Circular dependencies

### 2. Deployment Failures

**Symptom**: `wrangler deploy` fails

**Check with MCP**:

```
cloudflare-builds__get_build_errors
```

**Check manually**:

```bash
# Verify wrangler config
cat wrangler.jsonc

# Check authentication
wrangler whoami
```

**Common causes**:

- Invalid wrangler.jsonc syntax
- Bundle size exceeds 1MB limit
- Missing compatibility flags

### 3. Runtime Errors

**Symptom**: App crashes after deployment

**Debug with MCP**:

```
query_worker_observability (filter for errors in last 24h)
workers_builds_get_build_logs buildUUID="<build-id>"
```

**Or manually**:

```bash
wrangler tail --format pretty
```

**Common causes**:

- Missing environment variables
- Database connection issues
- Dynamic import failures

### 4. Database Connection Issues

**Symptom**: "Connection refused" or timeout errors

**Check with Neon MCP**:

```
neon_run_sql "SELECT 1"  # Test connection
neon_get_database_tables  # Verify schema
```

**Check secrets**:

```bash
wrangler secret list
```

**Solutions**:

- Ensure `?sslmode=require` in connection string
- Check Neon project is not suspended
- Verify secret value is correct

### 5. Dynamic Import Issues

**Symptom**: "Cannot find module" errors

**Check server functions for**:

```typescript
// ❌ WRONG - breaks on Workers
import { db } from '../db'

// ✅ CORRECT - works on Workers
const { db } = await import('../db')
```

**Action**: Search codebase for static db imports in server functions.

### 6. Bundle Size Issues

**Symptom**: "Script too large" error

**Check**:

```bash
ls -la dist/server/
```

**Solutions**:

- Remove unused dependencies
- Use dynamic imports for large libraries
- Check for accidentally bundled node_modules

## Compatibility Flags

Ensure `wrangler.jsonc` has:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
}
```

## When to Rollback

```bash
# If production is broken, rollback immediately
wrangler rollback

# Then debug in preview environment
wrangler deploy --env preview
```

## Debug Checklist

| Issue Type        | First Check                    | MCP Tool                    |
| ----------------- | ------------------------------ | --------------------------- |
| Build failure     | `bun run check`                | `workers_builds_get_build_logs` |
| Deploy failure    | `wrangler whoami`              | `workers_list`              |
| Runtime error     | `wrangler tail`                | `query_worker_observability` |
| DB connection     | Check secrets                  | `neon_run_sql`              |
| Module not found  | Check dynamic imports          | -                           |

## Agent Delegation

- `@devops-engineer` - Complex deployment and infrastructure issues
- `@backend-engineer` - Server function and database issues

## Related Prompts

- `@cloudflare-deploy` - Deployment process
- `@cloudflare-setup` - Initial configuration
- `@neon-setup` - Database configuration
