---
description: 'Complete Cloudflare Workers setup and configuration with MCP integration for LivestockAI'
---

# Cloudflare Workers Setup & Configuration

🚀 **Complete Cloudflare setup - from initial configuration to advanced features.**

## Context

**Project**: LivestockAI - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Deployment**: Cloudflare Workers (edge computing)
**Database**: Neon PostgreSQL (serverless)

## Step 0: Check Current State

First, let me understand your current Cloudflare setup:

> What's your current Cloudflare situation?
>
> Options:
>
> - `none` - No Cloudflare setup yet
> - `partial` - Started setup but incomplete
> - `complete` - Deployed and working, want advanced features
> - `issues` - Have setup but experiencing problems

Wait for their response.

### If `none`:

> I can help you set up Cloudflare Workers. Choose your preferred method:
>
> 1. **Automated Setup** (Recommended) - Run `@quickstart` for complete automated setup
> 2. **Manual Setup** - I'll guide you through manual Cloudflare configuration here
>
> Which would you prefer? (1/2)

**If they choose 1:** Guide them to run `@quickstart` and stop here.

**If they choose 2:** Continue to Manual Setup section below.

### If `partial`:

> Let me check what's already configured...

**Verify with MCP:**

```
# Check authentication
cloudflare-bindings__accounts_list

# Check for existing workers
cloudflare-bindings__workers_list

# Check wrangler config
wrangler_get_config
```

**Then ask:**

> I found: [summary of what exists]
>
> What would you like to do?
>
> - `continue` - Complete the setup
> - `restart` - Start fresh (will guide you)
> - `quickstart` - Use automated setup instead

### If `complete`:

> Great! Your Cloudflare is set up. What advanced features are you interested in?
>
> 1. Custom domains
> 2. Multiple environments (staging/production)
> 3. KV storage (caching)
> 4. R2 storage (file uploads)
> 5. Performance optimization
> 6. All of the above
>
> Choose one or more: (e.g., "1,2,3" or "all")

Skip to the relevant advanced feature sections.

### If `issues`:

> Let me help troubleshoot. What issues are you experiencing?
>
> Common issues:
>
> - Build failures
> - Deployment failures
> - Database connection errors
> - Cold start issues
> - Bundle size too large
>
> Describe your issue, or choose from above.

Skip to Troubleshooting section.

---

## Manual Setup (For `none` or `partial` users)

### Prerequisites

- [ ] Cloudflare account (create at https://dash.cloudflare.com)
- [ ] Cloudflare MCP authenticated (OAuth)
- [ ] `.dev.vars` file exists (copy from `.env`)

### Step 1: Verify Cloudflare Authentication

```bash
# Test authentication
wrangler whoami
```

**If not authenticated:**

```bash
# Authenticate with Cloudflare
wrangler login
```

**Verify with MCP:**

```
cloudflare-bindings__accounts_list
```

**If MCP unavailable:**

> ⚠️ Cloudflare MCP not available.
>
> Options:
>
> 1. Configure MCP in `.kiro/settings/mcp.json`
> 2. Use manual setup via CLI (I'll guide you)
>
> Which would you prefer? (1/2)

### Step 2: Select Cloudflare Account

**List accounts:**

```
cloudflare-bindings__accounts_list
```

**If single account:**

```
✅ Account found: [Account Name] (ID: abc123...)
🔄 Configuring automatically...
```

**If multiple accounts:**

> I found [N] Cloudflare accounts:
>
> 1. Personal Account (ID: abc123...)
> 2. Company Account (ID: def456...)
> 3. Client Project (ID: ghi789...)
>
> Which account should we use? (1/2/3)

### Step 3: Configure wrangler.jsonc

**Update account ID:**

```
wrangler_update_config {
  "account_id": "[selected-account-id]"
}
```

**Or manually edit `wrangler.jsonc`:**

```jsonc
{
  "name": "jayfarms",
  "account_id": "your-account-id-here",
  "compatibility_date": "2025-03-11",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
}
```

### Step 4: Set Up .dev.vars

**For local development:**

```bash
# Copy .env to .dev.vars
cp .env .dev.vars
```

**Why:** Cloudflare Workers uses `.dev.vars` for local development with `wrangler dev`.

### Step 5: Set Production Secrets

**Set required secrets:**

```bash
wrangler secret put DATABASE_URL
# Paste your production database URL

wrangler secret put BETTER_AUTH_SECRET
# Paste your auth secret (32+ characters)

wrangler secret put BETTER_AUTH_URL
# Enter your production URL (e.g., https://yourdomain.com)
```

**Verify secrets:**

```bash
wrangler secret list
```

Should show 3 secrets.

### Step 6: Test Local Development

```bash
# Test with wrangler dev
bun preview
```

**Verify:**

- Opens at http://localhost:8787
- Database connection works
- Authentication works

### Step 7: Deploy to Production

```bash
# Build and deploy
bun run deploy
```

**Verify deployment:**

```
cloudflare-bindings__workers_list
cloudflare-bindings__workers_get_worker scriptName="jayfarms"
```

### Step 8: Verify Production

**Test your deployed worker:**

```bash
# Get worker URL
wrangler deployments list
```

Visit the URL and verify:

- [ ] App loads
- [ ] Database connection works
- [ ] Authentication works
- [ ] Can create/read data

**Manual setup complete!** ✅

---

---

## Advanced Features (For users with `complete` setup)

### 1. Custom Domains

Set up custom domain for production:

**Step 1: Add domain to Cloudflare**

- Add your domain to Cloudflare DNS
- Update nameservers at your registrar

**Step 2: Configure Workers route**

```bash
wrangler route add "yourdomain.com/*" jayfarms
wrangler route add "www.yourdomain.com/*" jayfarms
```

**Step 3: Update BETTER_AUTH_URL**

```bash
wrangler secret put BETTER_AUTH_URL
# Enter: https://yourdomain.com
```

**Verify with MCP:**

```
cloudflare-bindings__workers_get_worker scriptName="jayfarms"
```

### 2. Multiple Environments (Staging/Production)

Set up staging and production environments in `wrangler.jsonc`:

```jsonc
{
  "name": "jayfarms",
  "account_id": "your-account-id",
  "env": {
    "staging": {
      "name": "jayfarms-staging",
      "vars": {
        "ENVIRONMENT": "staging",
      },
    },
    "production": {
      "name": "jayfarms-production",
      "vars": {
        "ENVIRONMENT": "production",
      },
    },
  },
}
```

**Set environment-specific secrets:**

```bash
# Staging
wrangler secret put DATABASE_URL --env staging
wrangler secret put BETTER_AUTH_URL --env staging

# Production
wrangler secret put DATABASE_URL --env production
wrangler secret put BETTER_AUTH_URL --env production
```

**Deploy to environments:**

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

**Verify:**

```
cloudflare-bindings__workers_list
```

### 3. KV Storage (Caching)

Use KV for session storage and caching:

**Create KV namespaces:**

```bash
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview
```

**Add to wrangler.jsonc:**

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "your-cache-namespace-id",
      "preview_id": "your-cache-preview-id",
    },
    {
      "binding": "SESSIONS",
      "id": "your-sessions-namespace-id",
      "preview_id": "your-sessions-preview-id",
    },
  ],
}
```

**Verify with MCP:**

```
cloudflare-bindings__kv_namespaces_list
```

### 4. R2 Storage (File Uploads)

Use R2 for user-uploaded files (farm images, documents):

**Create R2 bucket:**

```bash
wrangler r2 bucket create jayfarms-uploads
```

**Add to wrangler.jsonc:**

```jsonc
{
  "r2_buckets": [
    {
      "binding": "UPLOADS",
      "bucket_name": "jayfarms-uploads",
    },
  ],
}
```

**Verify with MCP:**

```
cloudflare-bindings__r2_buckets_list
```

### 5. Performance Optimization

**Bundle Size Analysis:**

```bash
# Check bundle size
bun run build
ls -lh .output/server/index.mjs

# Analyze dependencies
bun run build --analyze
```

**Optimization strategies:**

1. **Dynamic imports** - Already using for database
2. **Code splitting** - TanStack Router handles this
3. **Tree shaking** - Vite optimizes automatically
4. **Minimize dependencies** - Review package.json

**Cold Start Optimization:**

- Keep initialization code minimal
- Use dynamic imports for large modules
- Preload critical data in global scope

**Caching Strategy:**

```typescript
// Example: Cache static data in KV
const cachedData = await env.CACHE.get('key')
if (!cachedData) {
  const data = await fetchData()
  await env.CACHE.put('key', JSON.stringify(data), {
    expirationTtl: 3600, // 1 hour
  })
}
```

---

| Feature           | Command/MCP            | Expected Result  |
| ----------------- | ---------------------- | ---------------- |
| Worker deployed   | `workers_list`         | Worker listed    |
| Routes configured | `workers_get_worker`   | Routes shown     |
| KV created        | `kv_namespaces_list`   | Namespace listed |
| R2 created        | `r2_buckets_list`      | Bucket listed    |
| Secrets set       | `wrangler secret list` | 3 secrets        |

## Troubleshooting

### Build fails

- Ensure all dependencies installed: `bun install`
- Check for TypeScript errors: `bun run check`

### Deployment fails

- Verify wrangler.jsonc syntax
- Check compatibility flags: `nodejs_compat`
- Ensure bundle size under 1MB

### Database connection fails

- Verify DATABASE_URL secret is set correctly
- Check Neon project is active
- Ensure `?sslmode=require` in connection string

## Agent Delegation

- `@devops-engineer` - Complex infrastructure and deployment
- `@backend-engineer` - Server function optimization

## Related Prompts

- `@quickstart` - Initial deployment setup
- `@cloudflare-deploy` - Deployment process
- `@cloudflare-debug` - Troubleshooting issues
- `@neon-setup` - Database configuration

## Verification Checklist

**Basic Setup:**
| Feature | Command/MCP | Expected Result |
| ----------------- | ------------------------------------------------ | ---------------- |
| Authenticated | `wrangler whoami` | Shows your email |
| Account configured| `wrangler_get_config` | account_id set |
| Worker deployed | `cloudflare-bindings__workers_list` | Worker listed |
| Secrets set | `wrangler secret list` | 3+ secrets |

**Advanced Features:**
| Feature | Command/MCP | Expected Result |
| ----------------- | ------------------------------------------------ | ---------------- |
| Custom domain | `cloudflare-bindings__workers_get_worker` | Routes shown |
| KV created | `cloudflare-bindings__kv_namespaces_list` | Namespaces listed|
| R2 created | `cloudflare-bindings__r2_buckets_list` | Bucket listed |
| Environments | `cloudflare-bindings__workers_list` | Multiple workers |

---

## Troubleshooting

### Build Failures

**Problem**: "Build failed" or TypeScript errors

**Solutions:**

1. Install dependencies: `bun install`
2. Check TypeScript: `bun run check`
3. Clear cache: `rm -rf .vinxi && bun run build`
4. Verify Node version: `node --version` (need 22+)

### Deployment Failures

**Problem**: "Deployment failed" or "Unauthorized"

**Solutions:**

1. Verify authentication: `wrangler whoami`
2. Check account_id in `wrangler.jsonc`
3. Verify wrangler.jsonc syntax (valid JSON)
4. Check compatibility flags: `nodejs_compat` required
5. Ensure bundle size under 1MB: `ls -lh .output/server/index.mjs`

### Database Connection Errors

**Problem**: "Connection timeout" or "Database error"

**Solutions:**

1. Verify DATABASE_URL secret: `wrangler secret list`
2. Check Neon project is active (not suspended)
3. Ensure `?sslmode=require` in connection string
4. Test locally first: `bun preview`
5. Check Neon connection pooling is enabled

### MCP Not Working

**Problem**: Cloudflare MCP commands fail

**Solutions:**

1. Check `.kiro/settings/mcp.json` configuration
2. Verify MCP servers are enabled (not disabled: false)
3. Authenticate via OAuth (MCP will prompt)
4. Fallback to wrangler CLI commands
5. Check MCP server status: Look for initialization errors

### Cold Start Issues

**Problem**: Slow first request after deployment

**Solutions:**

1. Minimize initialization code
2. Use dynamic imports for large modules
3. Preload critical data in global scope
4. Consider using KV for caching
5. Monitor with Cloudflare Analytics

### Bundle Size Too Large

**Problem**: "Bundle exceeds 1MB limit"

**Solutions:**

1. Analyze bundle: `bun run build --analyze`
2. Remove unused dependencies
3. Use dynamic imports for large modules
4. Check for duplicate dependencies
5. Consider code splitting

---

## Instructions for Assistant

### Workflow

1. **Check current state** (Step 0) - Ask about their Cloudflare situation
2. **Route appropriately**:
   - `none` → Offer quickstart or manual setup
   - `partial` → Assess what exists, offer to continue
   - `complete` → Ask which advanced features they want
   - `issues` → Troubleshoot specific problems
3. **Execute chosen path** - Guide through setup or advanced features
4. **Validate each step** - Test before proceeding
5. **Document changes** - Update wrangler.jsonc and secrets

### Interactive Approach

**Always ask first:**

- What's their current state?
- What do they want to accomplish?
- Which features interest them?

**Tailor the experience:**

- New users → Recommend quickstart, offer manual as alternative
- Partial setup → Complete what's missing
- Complete setup → Focus on requested advanced features only
- Issues → Targeted troubleshooting

### Error Handling

**MCP unavailable:**

- Fallback to wrangler CLI commands
- Provide step-by-step CLI instructions
- Continue without MCP where possible

**Multiple accounts:**

- List all accounts
- Let user choose
- Use selected account for configuration

**Authentication fails:**

- Guide through `wrangler login`
- Verify with `wrangler whoami`
- Check MCP configuration

**Deployment fails:**

- Check build first
- Verify secrets
- Test locally with `bun preview`
- Provide detailed error analysis

### Key Principles

- **Interactive first** - Ask what user wants
- **Flexible paths** - Support quickstart, manual, or advanced
- **Validate state** - Check what exists before proceeding
- **Use MCP with fallbacks** - Don't fail if MCP unavailable
- **Provide specific commands** - Not just concepts
- **Test each step** - Validate before moving forward
- **Consider production** - Warn about production implications

## Agent Delegation

- `@devops-engineer` - Complex infrastructure and deployment
- `@backend-engineer` - Server function optimization

## Related Prompts

- `@quickstart` - Initial deployment setup
- `@cloudflare-deploy` - Deployment process
- `@cloudflare-debug` - Troubleshooting issues
- `@neon-setup` - Database configuration
