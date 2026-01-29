---
description: 'Debug Cloudflare Workers deployment issues'
---

# Debug Cloudflare Workers Issues

Systematic approach to debugging Cloudflare Workers deployment problems.

## Context

**Project**: LivestockAI - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Deployment**: Cloudflare Workers (edge computing)
**Database**: Neon PostgreSQL (serverless)

## Step 0: Issue Diagnosis

**Ask user interactively:**

> What issue are you experiencing?
>
> 1. **Build failure** - `bun run build` fails
> 2. **Deployment failure** - `wrangler deploy` fails
> 3. **Runtime error** - App crashes after deployment
> 4. **Database connection** - Connection errors
> 5. **Performance issue** - Slow response times
> 6. **Other** - Describe the issue

Wait for response, then route to appropriate troubleshooting section.

## Quick Diagnosis with MCP

### Check Deployment Status

**If MCP available:**

```
workers_list
workers_get_worker scriptName="livestockai"
workers_builds_list_builds
```

**If MCP unavailable (fallback):**

```bash
wrangler deployments list
wrangler whoami
```

### View Recent Errors

**If MCP available:**

```
query_worker_observability (filter by error level)
observability_keys (find available log fields)
```

**If MCP unavailable (fallback):**

```bash
wrangler tail --format pretty
```

### Search Cloudflare Docs for Solutions

**If MCP available:**

```
search_cloudflare_documentation query="workers runtime error"
search_cloudflare_documentation query="nodejs_compat"
```

**If MCP unavailable:**

- Visit https://developers.cloudflare.com/workers/

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
neon__run_sql "SELECT 1"  # Test connection
neon__get_database_tables  # Verify schema
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

**If production is broken:**

```bash
wrangler rollback
```

**Then debug in preview:**

```bash
wrangler deploy --env preview
```

**Ask user:** "Rollback successful. Test the preview deployment and let me know if the issue persists."

## Success Validation

After applying fixes, verify:

1. **Build succeeds:**

   ```bash
   bun run build
   ```

2. **Deployment succeeds:**

   ```bash
   wrangler deploy --dry-run
   ```

3. **App responds:**

   ```bash
   curl https://your-worker.workers.dev/api/health
   ```

4. **Database connects:**
   - Use Neon MCP: `neon__run_sql "SELECT 1"`
   - Or check logs: `wrangler tail`

5. **Monitor for errors:**
   - Watch logs for 5 minutes
   - Check error rate in dashboard

**Ask user:** "All checks passed. Monitor the deployment for the next hour and let me know if issues recur."

## Debug Checklist

| Issue Type       | First Check           | MCP Tool                        |
| ---------------- | --------------------- | ------------------------------- |
| Build failure    | `bun run check`       | `workers_builds_get_build_logs` |
| Deploy failure   | `wrangler whoami`     | `workers_list`                  |
| Runtime error    | `wrangler tail`       | `query_worker_observability`    |
| DB connection    | Check secrets         | `neon__run_sql`                 |
| Module not found | Check dynamic imports | -                               |

## Agent Delegation

Use specialized subagents for complex debugging:

- `@devops-engineer` - Complex deployment and infrastructure issues
- `@backend-engineer` - Server function and database connection issues
- `@frontend-engineer` - Client-side errors and bundle optimization
- `@security-engineer` - Authentication, secrets, and security issues
- `@qa-engineer` - Testing deployment and reproducing issues

### When to Delegate

- **Build failures** - @backend-engineer or @frontend-engineer (depending on error)
- **Database issues** - @backend-engineer for connection/query problems
- **Security/secrets** - @security-engineer for auth and environment variables
- **Performance** - @frontend-engineer for bundle size, @backend-engineer for queries
- **Testing** - @qa-engineer to create reproduction steps

## Related Prompts

- `@cloudflare-deploy` - Deployment process and best practices
- `@cloudflare-setup` - Initial configuration and setup
- `@neon-setup` - Database configuration and troubleshooting
- `@performance-audit` - Performance optimization after fixing issues
