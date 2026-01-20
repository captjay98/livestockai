---
description: 'Deploy OpenLivestock Manager to Cloudflare Workers with validation and rollback procedures'
---

# Deploy to Cloudflare Workers

Execute a production deployment to Cloudflare Workers with comprehensive validation and rollback procedures.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Platform**: Cloudflare Workers (Edge computing)
**Critical**: All server functions MUST use dynamic imports for Workers compatibility

## Prerequisites

- [ ] Wrangler CLI installed and authenticated
- [ ] All secrets configured in Cloudflare
- [ ] Tests passing locally
- [ ] Build succeeds locally
- [ ] Database accessible from Workers

## MCP Integration

**Check current deployment status:**

```
cloudflare-bindings__workers_list
cloudflare-builds__workers_builds_list_builds
```

**View recent logs:**

```
cloudflare-observability__query_worker_observability
```

## Pre-Deployment Checklist

### Step 1: Verify Authentication

```bash
# Check wrangler is authenticated
wrangler whoami

# Expected output: Your Cloudflare account email
```

**If not authenticated:**

```bash
wrangler login
```

### Step 2: Verify Secrets

```bash
# List configured secrets
wrangler secret list
```

**Required secrets:**
| Secret | Purpose | How to Set |
|--------|---------|------------|
| `DATABASE_URL` | Neon PostgreSQL connection | `wrangler secret put DATABASE_URL` |
| `BETTER_AUTH_SECRET` | Auth encryption (32+ chars) | `wrangler secret put BETTER_AUTH_SECRET` |
| `BETTER_AUTH_URL` | Production URL | `wrangler secret put BETTER_AUTH_URL` |

**Set missing secrets:**

```bash
# Database connection
wrangler secret put DATABASE_URL
# Paste: postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Auth secret (generate with: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Production URL
wrangler secret put BETTER_AUTH_URL
# Enter: https://your-domain.com or https://openlivestock.workers.dev
```

### Step 3: Run Full Test Suite

```bash
# Run all tests
bun test

# Expected: All tests pass
```

**If tests fail:** Fix issues before deploying. Do NOT deploy with failing tests.

### Step 4: Check TypeScript

```bash
# Type check
bun run check

# Expected: No errors
```

**Common issues:**

- Missing types in Kysely schema
- Incorrect import paths
- Type mismatches in server functions

### Step 5: Verify Build

```bash
# Build for production
bun run build

# Expected: Build succeeds, bundle size < 1MB
```

**Check bundle size:**

```bash
ls -la dist/
```

**If build fails:**

- Check for static imports of `db` (must be dynamic)
- Check for Node.js-only modules
- Verify all dependencies are Workers-compatible

### Step 6: Verify Dynamic Imports

**Critical check - static imports break Workers:**

```bash
# Search for violations
grep -rn "^import.*{ db }.*from" app/features/*/server.ts
grep -rn "^import.*db.*from.*\/db" app/features/

# Expected: No results (all imports should be dynamic)
```

**If violations found:** Fix before deploying:

```typescript
// ❌ WRONG - breaks Workers
import { db } from '~/lib/db'

// ✅ CORRECT - works on Workers
const { db } = await import('~/lib/db')
```

## Deployment

### Standard Production Deployment

```bash
# Build and deploy
bun run deploy

# Or step by step:
bun run build
wrangler deploy
```

**Expected output:**

```
Uploaded openlivestock (X.XX sec)
Published openlivestock (X.XX sec)
  https://openlivestock.your-subdomain.workers.dev
```

### Preview Deployment (Testing)

```bash
# Deploy to preview environment
wrangler deploy --env preview
```

Use preview for:

- Testing new features before production
- Verifying fixes before rollout
- Stakeholder demos

## Post-Deployment Verification

### Step 1: Check Deployment Status (MCP)

```
# List recent builds
cloudflare-builds__workers_builds_list_builds

# Get specific build details
cloudflare-builds__workers_builds_get_build buildUUID="xxx"
```

### Step 2: Verify Worker is Running (MCP)

```
# List workers
cloudflare-bindings__workers_list

# Get worker details
cloudflare-bindings__workers_get_worker scriptName="openlivestock"
```

### Step 3: Check Production Logs (MCP)

```
# Query recent logs
cloudflare-observability__query_worker_observability

# Search for errors
cloudflare-observability__observability_keys
```

### Step 4: Manual Verification

```bash
# Tail live logs
wrangler tail

# In another terminal, access the app
curl -I https://openlivestock.your-subdomain.workers.dev
```

### Step 5: Functional Testing

**Test critical paths:**

1. **Homepage loads**: Visit production URL
2. **Login works**: Test with admin credentials
3. **Database connected**: View batches list
4. **Create operation**: Add a test record
5. **Offline mode**: Disconnect and verify PWA works

## Rollback Procedures

### Immediate Rollback (Production Issues)

```bash
# Rollback to previous version immediately
wrangler rollback

# Confirm rollback
wrangler deployments list
```

### When to Rollback

- 🚨 **Immediate**: 500 errors, login broken, data loss
- ⚠️ **Soon**: Performance degradation, UI broken
- 📋 **Evaluate**: Minor bugs, cosmetic issues

### Post-Rollback Actions

1. **Verify rollback worked**: Test production
2. **Check logs**: Identify what went wrong
3. **Fix locally**: Reproduce and fix the issue
4. **Test thoroughly**: Run full test suite
5. **Redeploy**: When confident fix works

## Error Handling

### Common Deployment Issues

**Issue**: Build fails with "Cannot find module"
**Solution**: Check for static imports, ensure dynamic imports for db

**Issue**: Worker crashes on startup
**Solution**: Check secrets are set, verify DATABASE_URL format

**Issue**: 500 errors after deployment
**Solution**: Check logs with `wrangler tail`, verify database connection

**Issue**: Auth not working
**Solution**: Verify BETTER_AUTH_SECRET and BETTER_AUTH_URL secrets

**Issue**: Slow cold starts
**Solution**: Reduce bundle size, lazy load heavy dependencies

### Debug Commands

```bash
# View deployment history
wrangler deployments list

# Check worker status
wrangler deployments status

# View live logs
wrangler tail --format pretty

# Test locally with production config
wrangler dev --remote
```

## Deployment Checklist

### Pre-Deployment

- [ ] `wrangler whoami` shows correct account
- [ ] All secrets configured (`wrangler secret list`)
- [ ] `bun test` passes
- [ ] `bun run check` passes (no type errors)
- [ ] `bun run build` succeeds
- [ ] No static db imports found

### Deployment

- [ ] `bun run deploy` succeeds
- [ ] Deployment URL accessible

### Post-Deployment

- [ ] Homepage loads
- [ ] Login works
- [ ] Database operations work
- [ ] No errors in logs (MCP or `wrangler tail`)
- [ ] PWA offline mode works

## Success Criteria

- [ ] Deployment completes without errors
- [ ] Production URL returns 200 status
- [ ] Login flow works end-to-end
- [ ] Database queries succeed
- [ ] No errors in first 5 minutes of logs
- [ ] Rollback procedure documented and tested

## Related Prompts

- `@cloudflare-setup` - Advanced Cloudflare configuration
- `@cloudflare-debug` - Debug deployment issues
- `@quickstart` - Initial project setup
- `@code-review` - Pre-deployment code review

---

## Instructions for Assistant

### Workflow

1. **Run pre-deployment checks** - All must pass
2. **Verify secrets** - All required secrets set
3. **Execute deployment** - Use `bun run deploy`
4. **Verify with MCP** - Check build status and logs
5. **Functional testing** - Test critical paths
6. **Document results** - Report success or issues

### Key Principles

- **Never deploy with failing tests** - Fix first
- **Always verify secrets** - Missing secrets = broken app
- **Check dynamic imports** - Static imports break Workers
- **Have rollback ready** - Know how to revert quickly
- **Monitor after deploy** - Watch logs for 5+ minutes

### When to Stop and Ask

- Tests failing and fix unclear
- Secrets missing and values unknown
- Build errors not related to code
- Deployment succeeds but app broken
- Rollback needed but unsure of impact
