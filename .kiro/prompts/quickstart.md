---
description: 'Interactive setup wizard for LivestockAI'
---

# LivestockAI - Quick Start Wizard

🚀 Welcome! I'll help you get set up and productive with LivestockAI.

## What This Wizard Does

This automated setup wizard will:

1. ✅ **Check your environment** - Verify Node 22+, Bun 1.0+, Git
2. ✅ **Set up your project** - Install dependencies, create .env
3. ✅ **Create databases** - Production + Test databases via Neon MCP
4. ✅ **Configure environment** - All required environment variables
5. ✅ **Run migrations** - Set up database schema (24 tables)
6. ✅ **Seed data** - Optional demo data or minimal setup
7. ✅ **Verify setup** - Test dev server and test suite
8. ✅ **Guide next steps** - Get you productive immediately

**Estimated time**: 5-10 minutes (mostly automated)

**What you'll need**:

- A Neon account (free tier works perfectly)
- Node 22+ and Bun 1.0+ installed
- 5 minutes of your time

---

## Step 1: Environment Check

First, let me verify your development environment and git setup. Run these checks:

```bash
node --version  # Need 22+
bun --version   # Need 1.0+
git --version
git status 2>/dev/null || echo "Not a git repository"
```

**Ask the user**: "What's your Node version? Is this a git repository? (or say 'skip' if you know everything is installed)"

Based on their response:

- If Node < 22: Guide them to install Node 22+
- If no Bun: Visit https://bun.sh to install
- If not a git repo: Offer to run `git init`
- If all good: Continue to Step 2

## Step 2: Project Setup Check

Check the project state:

1. **Check if dependencies installed**:

   ```bash
   ls node_modules 2>/dev/null && echo "✅ Dependencies installed" || echo "❌ Run: bun install"
   ```

2. **Check if .env exists**:

   ```bash
   ls .env 2>/dev/null && echo "✅ .env exists" || echo "❌ Run: cp .env.example .env"
   ```

3. **Check DATABASE_URL**:
   ```bash
   grep DATABASE_URL .env 2>/dev/null && echo "✅ DATABASE_URL configured" || echo "❌ Need database URL"
   ```

**Ask the user**: "Should I check your project setup? (yes/no)"

If yes, run the checks and report:

- ✅ What's ready
- ❌ What's missing with fix commands

## Step 3: Database Setup (Automated)

**Ask**: "Do you have a Neon account? (yes/no/create)"

### If "create":

"Let's create your Neon account first:"

1. Visit https://neon.tech
2. Sign up (free tier is perfect)
3. Come back when ready

### If "yes":

"Perfect! Let me set up your databases automatically..."

**Use Neon MCP to:**

1. **Create project**: `neon_create_project "LivestockAI-{timestamp}"`
2. **Create production database**: `livestockai_prod`
3. **Create test database**: `livestockai_test`
4. **Create user**: `livestockai_user` with secure password
5. **Get connection strings**: For both databases
6. **Update .env**: Write all required environment variables
7. **Test connections**: Verify both databases are accessible
8. **Run migrations**: On both production and test databases

**Progress indicators:**

```
🔄 Creating database project... (30s)
✅ Project created: livestockai-prod-20260121

🔄 Creating production database... (15s)
✅ Database: livestockai_prod

🔄 Creating test database... (15s)
✅ Database: livestockai_test

🔄 Creating database user... (10s)
✅ User: livestockai_user (password: [secure])

🔄 Generating connection strings... (5s)
✅ Production: postgresql://livestockai_user:***@***.neon.tech/livestockai_prod
✅ Test: postgresql://livestockai_user:***@***.neon.tech/livestockai_test

🔄 Configuring environment variables... (5s)
✅ DATABASE_URL set
✅ DATABASE_URL_TEST set
✅ BETTER_AUTH_SECRET generated (32 chars)
✅ BETTER_AUTH_URL set (http://localhost:3001)

🔄 Testing database connections... (10s)
✅ Production database connection verified
✅ Test database connection verified

🔄 Running migrations on production database... (15s)
✅ Production schema created (24 tables)

🔄 Running migrations on test database... (15s)
✅ Test schema created (24 tables)
```

**Verify test database setup:**

```bash
# Use the dedicated test setup script
bun run db:test:setup
```

**Ask seeding options:**

"Choose your data setup:"

1. **Production (minimal)** - Admin user + reference data only
2. **Development (full)** - Sample farms, batches, transactions, customers
3. **Skip seeding** - Empty database

Based on choice:

- Production: `bun run db:seed`
- Development: `bun run db:seed:dev`
- Skip: Continue to next step

**Final validation:**

```
🔄 Verifying admin login... (5s)
✅ Admin user created: admin@livestockai.local

🔄 Running test suite... (10s)
✅ All tests passing (0 failures)

🎉 Database setup complete! (Total: ~3 minutes)

📋 Summary:
   • Production DB: livestockai_prod ✅
   • Test DB: livestockai_test ✅
   • Admin user: admin@livestockai.local
   • Default password: password123 (⚠️ Change in production!)
```

### If "no":

"No problem! You'll need a Neon account for the database:"

1. Visit https://neon.tech (free tier available)
2. Sign up and come back
3. I'll handle the rest automatically

**Ask**: "Ready to continue with Neon account? (yes/retry/manual)"

- If "manual": Fall back to current manual process
- If "retry": Go back to automated setup

### Error Handling:

- **Neon MCP fails**:
  - Check if Neon MCP is configured: Run `neon__get_current_user`
  - If not authenticated: Guide through OAuth authentication
  - Offer manual setup fallback if MCP unavailable
- **Project creation fails**:
  - Check Neon account limits (free tier: 10 projects)
  - Suggest using existing project or upgrading plan
- **Database creation fails**:
  - Verify project exists and is active
  - Check for naming conflicts
  - Retry with different database name
- **Migration fails**:
  - Show detailed error message
  - Check if schema already exists
  - Offer to drop and recreate (⚠️ data loss warning)
  - Suggest manual fix with `@neon-migrate`
- **Connection fails**:
  - Verify credentials are correct
  - Check if database is active (not suspended)
  - Test with: `neon__execute_query "SELECT 1"`
  - Suggest troubleshooting with `@neon-setup`

- **Test database setup fails**:
  - Continue with production database only
  - Warn that integration tests won't work
  - Offer to retry test database setup later

- **Seeding fails**:
  - Check migration status first
  - Verify admin user doesn't already exist
  - Show error and offer to continue without seeding
  - Can seed later with `bun run db:seed`

## Step 4: Verify Everything Works

### Development Server

```bash
bun dev
```

**Ask**: "Is the dev server running? Can you open http://localhost:3001? (yes/no)"

- If yes: Continue to test verification
- If no: Debug common issues:
  - Port in use: `PORT=3002 bun dev`
  - Database error: Check DATABASE_URL in .env
  - Module errors: `rm -rf node_modules && bun install`
  - Build errors: `bun run check` to see type/lint errors

### Test Suite Verification

Let's verify your test setup works:

```bash
# Run unit tests (no database required)
bun test

# Run integration tests (requires test database)
bun test:integration
```

**Expected results:**

```
✅ Unit tests: All passing
✅ Integration tests: All passing (if DATABASE_URL_TEST is set)
⚠️  Integration tests: Skipped (if no test database)
```

**If tests fail:**

1. **Type errors**: Run `bun run check` to see issues
2. **Database errors**: Verify DATABASE_URL_TEST is set correctly
3. **Migration errors**: Run `DATABASE_URL=$DATABASE_URL_TEST bun run db:migrate`
4. **Module errors**: Try `rm -rf node_modules && bun install`

**Ask**: "Are all tests passing? (yes/no/skip)"

- If yes: 🎉 Everything is working!
- If no: Debug the specific failures
- If skip: Continue (but recommend fixing later)

## Step 5: Cloudflare Setup (Optional but Recommended)

### Part A: Local Development with Cloudflare Workers

For testing Cloudflare Workers locally, you need a `.dev.vars` file:

**Ask**: "Do you want to set up Cloudflare Workers local development? (yes/no/later)"

If yes:

```bash
# Copy .env to .dev.vars for Cloudflare local development
cp .env .dev.vars
```

**Why**: Cloudflare Workers uses `.dev.vars` instead of `.env` for local development with `wrangler dev`.

**Test it works:**

```bash
bun preview  # Runs wrangler dev
```

### Part B: Cloudflare Account Configuration (Automated)

**Ask**: "Do you have a Cloudflare account? (yes/no/create/later)"

If "create":

1. Visit https://dash.cloudflare.com
2. Sign up (free tier available)
3. Come back when ready

If "yes":

"Perfect! Let me configure your Cloudflare account automatically..."

**Use Cloudflare MCP to:**

1. **Authenticate**: Ensure wrangler is logged in
2. **List accounts**: Use `cloudflare-bindings__accounts_list` to get all accounts
3. **Handle multiple accounts**:
   - If 1 account: Use it automatically
   - If multiple accounts: Show list and ask user to choose
4. **Update wrangler.jsonc**: Use `wrangler_update_config` to set account_id automatically

**Progress indicators:**

```
🔄 Checking Cloudflare authentication... (5s)
✅ Authenticated as: your-email@example.com

🔄 Fetching your Cloudflare accounts... (5s)
```

**If single account:**

```
✅ Account found: Your Account Name (ID: abc123...)

🔄 Updating wrangler.jsonc... (2s)
✅ Account ID configured in wrangler.jsonc

🎉 Cloudflare setup complete!
```

**If multiple accounts:**

```
✅ Found 3 Cloudflare accounts:

1. Personal Account (ID: abc123...)
2. Company Account (ID: def456...)
3. Client Project (ID: ghi789...)
```

**Ask**: "Which account should I use for this project? (1/2/3)"

Wait for their choice, then:

```
🔄 Updating wrangler.jsonc with account: Company Account... (2s)
✅ Account ID configured in wrangler.jsonc

🎉 Cloudflare setup complete!
```

**If authentication fails:**

```bash
# Authenticate with Cloudflare
wrangler login
```

Then retry the automated setup.

**Manual fallback** (if MCP unavailable):

1. Go to https://dash.cloudflare.com
2. Click "Workers & Pages" in sidebar
3. Copy your Account ID from the right sidebar
4. Update `wrangler.jsonc`:
   ```jsonc
   {
     "account_id": "your-account-id-here",
   }
   ```

### Part C: Cloudflare MCP (Optional)

Cloudflare MCP uses OAuth - no API key needed. On first use, it opens a browser for authentication.

Available servers:

- `cloudflare-bindings` - Manage Workers, KV, R2
- `cloudflare-builds` - Deployment status
- `cloudflare-observability` - Logs and debugging
- `cloudflare-docs` - Documentation search

**Ask**: "Do you want to enable additional Cloudflare MCP servers? (yes/no/later)"

If yes, explain they're already configured in `.kiro/settings/mcp.json` but some are disabled by default. They can enable them by editing the file or will be prompted when needed.

---

## Environment Variables Reference

Your `.env` file should contain these variables after setup:

### Required Variables

```bash
# Production Database (set by quickstart)
DATABASE_URL=postgresql://livestockai_user:***@***.neon.tech/livestockai_prod?sslmode=require

# Test Database (set by quickstart)
DATABASE_URL_TEST=postgresql://livestockai_user:***@***.neon.tech/livestockai_test?sslmode=require

# Authentication (generated by quickstart)
BETTER_AUTH_SECRET=<32-character-random-string>
BETTER_AUTH_URL=http://localhost:3001
```

### Optional Variables

```bash
# Custom Admin User (optional - defaults used if not set)
ADMIN_EMAIL=admin@livestockai.local
ADMIN_PASSWORD=password123
ADMIN_NAME=Admin User

# Development Settings
NODE_ENV=development
PORT=3001

# Email/SMS Notifications (OPTIONAL - app works 100% without these)
# These enhance notifications but are NOT required for core functionality
# See .env.example for full configuration options:
# - Email: SMTP or Resend
# - SMS: Console (dev), Termii (Africa), or Twilio (global)
```

### Production Variables (for deployment)

```bash
# Production Auth URL (set before deploying)
BETTER_AUTH_URL=https://your-domain.com

# Production Admin (set before first deployment)
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=<secure-password>
ADMIN_NAME=Your Name
```

**Security Notes:**

- ⚠️ Never commit `.env` to git (already in `.gitignore`)
- ⚠️ Change default passwords before production deployment
- ⚠️ Use strong passwords for production admin user
- ⚠️ Rotate BETTER_AUTH_SECRET if compromised

---

## Step 6: What Do You Want To Do?

🎉 **Setup Complete!** Now let's get you productive.

**Quick tip**: Run `bun run check` before committing to ensure code quality (Prettier + ESLint).

**Ask**: "What would you like to do next?"

1. **Learn the codebase** → "Run `@prime` to load project context"
2. **Start a new feature** → "Run `@plan-feature` to plan your feature"
3. **Set up deployment** → "Run `@cloudflare-setup` for Cloudflare Workers"
4. **Explore the data** → "Run `@batch-analysis` to see livestock analytics"
5. **Just explore** → Point them to key files and documentation

Based on their choice, guide them to the appropriate next step.

---

## Quick Reference

### Available Agents

```bash
kiro-cli --agent livestock-specialist  # Domain expertise
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, deployment
kiro-cli --agent data-analyst          # Analytics, forecasting
kiro-cli --agent qa-engineer           # Testing
kiro-cli --agent security-engineer     # Auth, security
```

### Key Prompts

| Task         | Prompt               |
| ------------ | -------------------- |
| Load context | `@prime`             |
| Plan feature | `@plan-feature`      |
| Implement    | `@execute`           |
| Code review  | `@code-review`       |
| Deploy       | `@cloudflare-deploy` |
| Database     | `@neon-migrate`      |

### Important Files

| File              | Purpose            |
| ----------------- | ------------------ |
| `README.md`       | Project overview   |
| `AGENTS.md`       | AI assistant guide |
| `DEVLOG.md`       | Development log    |
| `.kiro/README.md` | Kiro config guide  |

---

## 📝 Remember: Keep DEVLOG Updated!

As you develop, update `DEVLOG.md` with:

- Features you implement
- Decisions you make
- Challenges you face
- Kiro features you use

---

## Instructions for Assistant

### Workflow

1. **Check environment** - Verify Node, Bun, Git versions
2. **Check project state** - Dependencies, .env, DATABASE_URL
3. **Fix missing items** - Guide through each fix interactively
4. **Set up database** - Migrations and optional seeding
5. **Verify working** - Dev server runs successfully
6. **Guide next steps** - Based on what user wants to do

### Be Interactive

- Ask one question at a time
- Run checks and report results
- Offer to fix issues automatically
- Celebrate successes! 🎉

### Handle Issues

- If something fails, explain why and how to fix
- Offer alternative solutions
- Know when to suggest `@neon-setup` or `@cloudflare-setup`

### Success Criteria

- User has working dev environment
- User knows what to do next
- User feels confident, not overwhelmed

## Agent Delegation

For complex issues during setup:

- `@devops-engineer` - Deployment and infrastructure issues
- `@backend-engineer` - Database connection problems

## Related Prompts

- `@prime` - Load project context after setup
- `@plan-feature` - Start planning your first feature
- `@neon-setup` - Advanced database configuration
- `@cloudflare-deploy` - Deploy to production

---

## Troubleshooting Common Issues

### Database Connection Issues

**Problem**: "Error: connect ECONNREFUSED" or "Connection timeout"

**Solutions**:

1. Check DATABASE_URL format: `postgresql://user:pass@host/dbname?sslmode=require`
2. Verify database is active in Neon console (not suspended)
3. Test connection: `neon__execute_query "SELECT 1"`
4. Check for typos in connection string
5. Ensure `?sslmode=require` is at the end

### Migration Failures

**Problem**: "Migration failed" or "Table already exists"

**Solutions**:

1. Check migration status: `bun run db:migrate`
2. View migration history in Neon console
3. For test database: `DATABASE_URL=$DATABASE_URL_TEST bun run db:migrate`
4. If stuck, use `@neon-migrate` for advanced help
5. Last resort: Drop and recreate database (⚠️ data loss)

### Test Database Issues

**Problem**: Integration tests fail or skip

**Solutions**:

1. Verify DATABASE_URL_TEST is set in .env
2. Run migrations on test database: `DATABASE_URL=$DATABASE_URL_TEST bun run db:migrate`
3. Check test database exists in Neon console
4. Ensure test database uses same user as production

### Authentication Issues

**Problem**: "Invalid session" or "Auth error"

**Solutions**:

1. Verify BETTER_AUTH_SECRET is set (32+ characters)
2. Check BETTER_AUTH_URL matches your dev server URL
3. Clear browser cookies and try again
4. Regenerate secret: `openssl rand -base64 32`

### Cloudflare Account Issues

**Problem**: "Account ID not set" or "Unauthorized"

**Solutions**:

1. Get account ID from https://dash.cloudflare.com → Workers & Pages
2. Update `wrangler.jsonc` with your account ID
3. Authenticate: `wrangler login`
4. Verify: `wrangler whoami`

### .dev.vars vs .env

**Problem**: "Environment variables not working with wrangler dev"

**Solutions**:

1. Cloudflare Workers uses `.dev.vars` for local development
2. Copy your `.env` to `.dev.vars`: `cp .env .dev.vars`
3. Use `bun preview` (runs wrangler dev) instead of `bun dev`
4. For production, use `wrangler secret put` (never commit secrets)

### Port Already in Use

**Problem**: "Port 3001 already in use"

**Solutions**:

1. Use different port: `PORT=3002 bun dev`
2. Find and kill process: `lsof -ti:3001 | xargs kill`
3. Update BETTER_AUTH_URL if using different port

### Module/Dependency Issues

**Problem**: "Cannot find module" or "Type errors"

**Solutions**:

1. Reinstall dependencies: `rm -rf node_modules && bun install`
2. Clear build cache: `rm -rf .vinxi`
3. Check Node version: `node --version` (need 22+)
4. Run type check: `bun run check`

### Seeding Issues

**Problem**: "Seeding failed" or "User already exists"

**Solutions**:

1. Check if admin user exists: Query users table in Neon
2. Drop and recreate if needed (development only)
3. Use different admin email in .env
4. Skip seeding and create user manually

### Need More Help?

- Run `@neon-setup` for database-specific issues
- Run `@cloudflare-debug` for deployment issues
- Check `AGENTS.md` for detailed architecture info
- Review `docs/DATABASE.md` for database patterns
