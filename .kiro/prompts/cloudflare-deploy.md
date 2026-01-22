---
description: 'Deploy OpenLivestock Manager to Cloudflare Workers with validation and rollback procedures'
---

# Deploy to Cloudflare Workers

Execute a production deployment to Cloudflare Workers with comprehensive validation and rollback procedures.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Platform**: Cloudflare Workers (Edge computing)
**Critical**: All server functions MUST use dynamic imports for Workers compatibility

## Step 0: Pre-Flight Check

First, let me verify your deployment readiness:

> What would you like to deploy?
>
> Options:
>
> - `preview` - Deploy to preview/staging environment (safe testing)
> - `production` - Deploy to production (live users)
> - `check` - Just run pre-deployment checks (no deploy)
>
> Choose: (preview/production/check)

Wait for their response.

### If `preview`:

> Deploying to preview environment for testing. This is safe and won't affect production.

Continue to deployment with `--env preview` flag.

### If `production`:

> ⚠️ **PRODUCTION DEPLOYMENT**
>
> This will deploy to live production environment. Are you sure?
>
> - All tests passing?
> - Code reviewed?
> - Ready for users to see changes?
>
> Confirm production deployment? (yes/no)

Wait for confirmation. If "no", stop. If "yes", continue.

### If `check`:

> Running pre-deployment checks only. No deployment will occur.

Run all checks and report results, then stop.

---

## Prerequisites Verification

**Check current setup state:**

```bash
# Verify wrangler authentication
wrangler whoami

# Check wrangler.jsonc exists and is valid
cat wrangler.jsonc | grep account_id

# Verify .env exists
ls .env
```

**If any fail:**

> ❌ Setup incomplete. Please run one of:
>
> - `@quickstart` - Complete automated setup
> - `@cloudflare-setup` - Manual Cloudflare configuration
>
> Cannot proceed with deployment until setup is complete.

Stop here and guide them to setup.

**If all pass:**

> ✅ Setup verified. Proceeding with deployment checks...

---

---

## Pre-Deployment Checklist

### Step 1: Verify Authentication

```bash
# Check wrangler is authenticated
wrangler whoami
```

**Expected:** Your Cloudflare account email

**If not authenticated:**

```bash
wrangler login
```

**Verify with MCP:**

```
cloudflare-bindings__accounts_list
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

**If secrets missing:**

> ⚠️ Missing required secrets: [list]
>
> Set them now? (yes/no)

If yes, guide through setting each secret:

```bash
# Database connection
wrangler secret put DATABASE_URL
# Paste: postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Auth secret (generate with: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Production URL
wrangler secret put BETTER_AUTH_URL
# Enter: https://your-domain.com or https://jayfarms.workers.dev
```

### Step 3: Run Full Test Suite

```bash
# Run all tests
bun test
```

**Expected:** All tests pass ✅

**If tests fail:**

> ❌ Tests failing. Cannot deploy with failing tests.
>
> Options:
>
> - Fix the failing tests first
> - Skip tests (NOT RECOMMENDED for production)
>
> What would you like to do? (fix/skip/abort)

If "skip" and environment is "production":

> ⚠️ **DANGER**: Skipping tests for production deployment is risky!
>
> Are you absolutely sure? (type "SKIP TESTS" to confirm)

Only proceed if they type exactly "SKIP TESTS".

If "abort", stop deployment.

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

### Deployment Strategy

**For preview environment:**

```bash
# Deploy to preview
wrangler deploy --env preview
```

Safe for testing - doesn't affect production users.

**For production environment:**

> 🚀 **Ready to deploy to production**
>
> Deployment strategy:
>
> 1. **Direct** - Deploy immediately to production (fastest)
> 2. **Preview First** - Deploy to preview, test, then production (safest)
>
> Which strategy? (1/2)

**If strategy 2 (Preview First):**

```bash
# Step 1: Deploy to preview
wrangler deploy --env preview
```

> Preview deployed! Test at: [preview-url]
>
> Test the preview environment:
>
> - [ ] Homepage loads
> - [ ] Login works
> - [ ] Database operations work
>
> Ready to deploy to production? (yes/no)

Wait for confirmation before proceeding to production.

### Execute Deployment

**Deploy command:**

```bash
# Build and deploy
bun run deploy

# Or with specific environment
wrangler deploy --env [environment]
```

**Progress indicators:**

```
🔄 Building application... (30s)
✅ Build complete

🔄 Uploading to Cloudflare... (10s)
✅ Upload complete

🔄 Publishing worker... (5s)
✅ Published successfully

🎉 Deployment complete!
   URL: https://jayfarms.workers.dev
```

**Expected output:**

```
Uploaded jayfarms (X.XX sec)
Published jayfarms (X.XX sec)
  https://jayfarms.your-subdomain.workers.dev
```

## Post-Deployment Verification & Monitoring

### Step 1: Immediate Verification (MCP)

```
# Check deployment status
cloudflare-builds__workers_builds_list_builds

# Verify worker is running
cloudflare-bindings__workers_list
cloudflare-bindings__workers_get_worker scriptName="jayfarms"
```

**Expected:** Worker listed and active

### Step 2: Functional Testing

**Test critical paths:**

```bash
# Get deployment URL
wrangler deployments list
```

**Manual tests:**

1. ✅ **Homepage loads**: Visit production URL
2. ✅ **Login works**: Test with admin credentials
3. ✅ **Database connected**: View batches list
4. ✅ **Create operation**: Add a test record
5. ✅ **Offline mode**: Disconnect and verify PWA works

> All critical paths working? (yes/no)

If "no":

> ⚠️ Issues detected. Consider rollback?
>
> Options:
>
> - `rollback` - Revert to previous version immediately
> - `investigate` - Check logs and investigate
> - `continue` - Monitor and fix if needed
>
> What would you like to do? (rollback/investigate/continue)

### Step 3: Monitor Logs (5 minutes)

> 🔍 **Monitoring deployment for 5 minutes...**
>
> Watching for errors, performance issues, and user activity.

**Start log monitoring:**

```bash
# Tail live logs
wrangler tail --format pretty
```

**Via MCP:**

```
# Query recent logs
cloudflare-observability__query_worker_observability

# Check for errors
cloudflare-observability__observability_keys
```

**Watch for:**

- ❌ 500 errors
- ⚠️ Slow response times (>1s)
- ⚠️ Database connection errors
- ⚠️ Authentication failures
- ✅ Successful requests

**After 5 minutes:**

> Monitoring complete. Summary:
>
> - Total requests: [count]
> - Errors: [count]
> - Average response time: [ms]
> - Status: [healthy/issues detected]

**If issues detected:**

> ⚠️ Issues found during monitoring:
> [list of issues]
>
> Recommended action: [rollback/investigate/monitor longer]
>
> What would you like to do?

## Deployment Summary

### Success Report

**If deployment successful:**

```
🎉 DEPLOYMENT SUCCESSFUL

Environment: [preview/production]
Deployed at: [timestamp]
URL: [deployment-url]
Build time: [duration]
Deployment time: [duration]

✅ Pre-deployment checks: Passed
✅ Deployment: Successful
✅ Functional tests: Passed
✅ Monitoring (5min): No issues

Status: HEALTHY ✅

Next steps:
- Monitor logs for next hour
- Watch for user reports
- Document any changes in DEVLOG.md
```

### Failure Report

**If deployment failed:**

```
❌ DEPLOYMENT FAILED

Environment: [preview/production]
Failed at: [timestamp]
Stage: [which step failed]

Error: [error message]

Recommended actions:
1. [specific fix for the error]
2. [alternative approach]
3. Run @cloudflare-debug for detailed troubleshooting

Status: FAILED ❌
```

### Rollback Report

**If rollback executed:**

```
↩️ ROLLBACK EXECUTED

Reason: [why rollback was needed]
Rolled back at: [timestamp]
Previous version: [version]
Current version: [version]

✅ Rollback: Successful
✅ Verification: Previous version working

Status: ROLLED BACK ✅

Next steps:
1. Fix the issue locally
2. Test thoroughly
3. Attempt redeployment when ready
```

---

### Immediate Rollback (Production Issues)

```bash
# Rollback to previous version immediately
wrangler rollback

# Confirm rollback
wrangler deployments list
```

## Agent Delegation

Use specialized subagents for deployment issues:

- `@devops-engineer` - Deployment failures, infrastructure issues
- `@backend-engineer` - Server function errors, database connection issues
- `@security-engineer` - Secrets management, authentication problems

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
- [ ] `bun run test` passes
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

1. **Check environment** (Step 0) - Ask which environment to deploy
2. **Verify setup** - Check prerequisites are met
3. **Run pre-deployment checks** - All must pass (or get explicit skip confirmation)
4. **Choose deployment strategy** - Direct or preview-first
5. **Execute deployment** - Deploy to chosen environment
6. **Verify immediately** - Test critical paths
7. **Monitor for 5 minutes** - Watch logs for issues
8. **Generate summary report** - Clear success/failure/rollback report

### Interactive Decision Points

**Always ask, never assume:**

- Which environment? (preview/production/check-only)
- Production deployment confirmed?
- Tests failing - fix/skip/abort?
- Deployment strategy? (direct/preview-first)
- Preview tested and ready for production?
- Issues detected - rollback/investigate/continue?

### Safety Checks

**Never skip without confirmation:**

- Production deployment requires explicit "yes"
- Skipping tests requires typing "SKIP TESTS"
- Rollback requires understanding impact

**Stop deployment if:**

- Setup incomplete (no wrangler.jsonc or secrets)
- Tests fail and user chooses "abort"
- User says "no" to production confirmation
- Critical errors during deployment

### Monitoring Protocol

**5-minute monitoring period:**

- Start immediately after deployment
- Watch for errors, slow responses, failures
- Provide real-time updates
- Summarize findings at end
- Recommend action if issues found

### Key Principles

- **Interactive first** - Ask before critical actions
- **Safety first** - Confirm production deployments
- **Never deploy broken code** - Tests must pass
- **Monitor after deploy** - Watch for 5 minutes minimum
- **Clear reporting** - Provide detailed summary
- **Rollback ready** - Know how to revert quickly
- **Use MCP for verification** - Check deployment status

### When to Stop and Ask

- Tests failing and fix unclear
- Secrets missing and values unknown
- Deployment fails with unclear error
- Issues detected during monitoring
- User unsure about proceeding
- Rollback needed but impact unclear
