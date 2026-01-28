---
description: 'Load comprehensive OpenLivestock Manager project context with MCP integration'
---

# Prime: Load OpenLivestock Manager Context

Build deep understanding of the OpenLivestock Manager codebase through documentation, database exploration, and live data analysis.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Tech Stack**: TanStack Start, Kysely ORM, Neon PostgreSQL, Cloudflare Workers, Better Auth
**Target Users**: Nigerian farmers managing poultry (broilers, layers) and aquaculture (catfish, tilapia)

## Objective

Load comprehensive project context to enable effective development, including:

- Architecture and patterns understanding
- Live database state via MCP
- Current development status
- Available agents and prompts

## Process

### Step 0: Context Check

**First, understand the current state:**

> Are you just getting started with this project, or have you been working on it already?
>
> Options:
>
> - `new` - Just ran quickstart or first time here
> - `existing` - Been working on this project
> - `returning` - Coming back after a break

Wait for their response to tailor the context loading.

**If `new`:**

- Focus on architecture and patterns
- Skip git history (not relevant yet)
- Emphasize critical patterns (dynamic imports)

**If `existing`:**

- Quick refresh on recent changes
- Check git status for uncommitted work
- Focus on current development state

**If `returning`:**

- Full context reload
- Review recent commits and changes
- Check database state changes

### Step 1: Core Documentation

**Validate critical files exist:**

```bash
# Check for essential files
ls README.md AGENTS.md DEVLOG.md .env package.json 2>/dev/null
```

**If any missing:**

- `README.md` missing → ⚠️ Core documentation missing
- `AGENTS.md` missing → ⚠️ Agent guide missing
- `DEVLOG.md` missing → ⚠️ Development log missing
- `.env` missing → ❌ **CRITICAL**: Run `@quickstart` first
- `package.json` missing → ❌ **CRITICAL**: Not in project root

**If .env missing:**

> ❌ Environment not configured. Please run `@quickstart` first to set up the project.

Stop here and guide them to quickstart.

**If all present, read essential docs:**

```bash
cat README.md
cat AGENTS.md
cat DEVLOG.md
```

**Key takeaways to extract:**

- Project purpose and target users
- Tech stack and architecture
- Development history and decisions
- Available agents and their capabilities

### Step 2: Architecture Deep Dive

**Tech Stack:**
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19 + TanStack Router | UI and routing |
| Backend | TanStack Start (SSR) | Server functions |
| Database | Neon PostgreSQL + Kysely | Type-safe data access |
| Deployment | Cloudflare Workers | Edge computing |
| Auth | Better Auth | Session management |
| State | TanStack Query + IndexedDB | Offline-first caching |

**🚨 Critical Pattern - Dynamic Imports:**

```typescript
// ✅ REQUIRED for Cloudflare Workers
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
    const { db } = await import('../db') // Dynamic import!
    return db.selectFrom('table').execute()
})

// ❌ BREAKS on Cloudflare Workers
import { db } from '../db' // Static import fails!
```

### Step 3: Project Structure

```bash
tree -L 2 -I 'node_modules|.git|dist|.vinxi' app/
```

**Key Directories:**

```
app/
├── routes/           # TanStack Router pages
│   ├── _auth/        # Protected routes (require login)
│   └── api/          # API endpoints
├── components/       # Reusable UI components
│   └── ui/           # Base components (shadcn/ui)
├── lib/              # Business logic
│   ├── auth/         # Better Auth configuration
│   ├── batches/      # Batch management
│   ├── db/           # Database (Kysely + migrations)
│   ├── finance/      # Financial calculations
│   ├── growth/       # Growth forecasting
│   └── currency.ts   # NGN formatting
└── styles/           # Global styles
```

### Step 4: Database Exploration (MCP)

**Use Neon MCP to explore live database:**

**First, verify MCP is available:**

```bash
# Test Neon MCP connection
neon__get_current_user
```

**If MCP fails:**

> ⚠️ Neon MCP not available. Skipping live database exploration.
>
> You can still work with the project, but won't see current database state.
> To enable MCP: Check `.kiro/settings/mcp.json` configuration.

Continue without database exploration.

**If MCP works, explore database:**

```
# List all tables
neon__get_database_tables

# Check table schemas (key tables only)
neon__describe_table_schema "batches"
neon__describe_table_schema "farms"
neon__describe_table_schema "users"
```

**Get data summary (with error handling):**

Try to run these queries, but handle gracefully if they fail:

```
# Try to get batch summary
neon__execute_query "SELECT COUNT(*) as count, status FROM batches GROUP BY status"

# Try to get user count
neon__execute_query "SELECT COUNT(*) as total_users FROM users"

# Try to get revenue summary
neon__execute_query "SELECT SUM(totalAmount) as total_revenue FROM sales WHERE totalAmount IS NOT NULL"
```

**If queries fail:**

- Empty database → "Database is empty (run seeding if needed)"
- Connection error → "Database connection issue (check DATABASE_URL)"
- Permission error → "Database access denied (check credentials)"

**Key Tables:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `farms` | Farm entities | id, name, type |
| `batches` | Livestock batches | farmId, species, livestockType, status, currentQuantity |
| `mortality_records` | Death tracking | batchId, quantity, cause, date |
| `feed_records` | Feed consumption | batchId, feedType, quantityKg, cost, date |
| `weight_samples` | Growth tracking | batchId, averageWeightKg, date |
| `sales` | Revenue | batchId, quantity, totalAmount, customerId, date |
| `expenses` | Costs | farmId, category, amount, date |
| `users` | Accounts | email, name, role |
| `customers` | Buyers | name, type, contactInfo |
| `suppliers` | Vendors | name, type, contactInfo |

### Step 5: Current Development State

**Check git status (with error handling):**

```bash
# Verify git repository
git rev-parse --git-dir 2>/dev/null
```

**If not a git repository:**

> ⚠️ Not a git repository. Consider running `git init` to enable version control.

Skip git-related checks.

**If git repository exists:**

```bash
# Git status
git status
git branch -v
git log -5 --oneline

# Check for uncommitted work
git diff --stat
```

**Identify:**

- Current branch and recent commits
- Any uncommitted changes
- Active feature development

**Handle common scenarios:**

- **Clean working tree** → "✅ No uncommitted changes"
- **Uncommitted changes** → "⚠️ You have uncommitted work in [files]"
- **Untracked files** → "ℹ️ New files not yet tracked: [files]"
- **Detached HEAD** → "⚠️ Detached HEAD state - consider creating a branch"

### Step 6: Kiro Configuration

**Available Agents (8):**
| Agent | Expertise | MCP Access |
|-------|-----------|------------|
| `livestock-specialist` | Farming domain, batch analysis | Neon |
| `backend-engineer` | TanStack Start, Kysely, APIs | Neon |
| `frontend-engineer` | React, UI, PWA | - |
| `devops-engineer` | Cloudflare, deployment | Neon, Cloudflare |
| `data-analyst` | Analytics, forecasting | Neon |
| `qa-engineer` | Testing, quality | - |
| `security-engineer` | Auth, security | - |
| `i18n-engineer` | Localization | - |

**Available Prompts (25):**

- **Core**: @prime, @plan-feature, @execute, @code-review, @quickstart
- **Infrastructure**: @neon-setup, @neon-migrate, @cloudflare-deploy, @cloudflare-debug
- **Livestock**: @batch-analysis, @growth-forecast, @mortality-analysis, @feed-optimization
- **Financial**: @financial-report, @cost-analysis, @sales-forecast
- **Quality**: @test-coverage, @accessibility-audit, @performance-audit

### Step 7: Livestock Domain Context

**Species Supported:**

- **Poultry**: Broilers (5-8 weeks), Layers (18+ weeks), Turkey, Duck
- **Aquaculture**: Catfish (4-6 months), Tilapia

**Key Metrics:**
| Metric | Broiler Target | Catfish Target |
|--------|----------------|----------------|
| FCR | 1.6-1.8 | 1.2-1.5 |
| Mortality | <5% | <10% |
| Harvest Weight | 2.0-2.5kg | 1.0-1.5kg |
| Cycle Length | 6-8 weeks | 4-6 months |

**Nigerian Context:**

- Currency: Nigerian Naira (₦)
- Challenges: Power outages, feed quality, market volatility
- Regions: Kaduna, Ogun, Delta states

## Output Report

### 📊 Project Summary

```
OpenLivestock Manager
━━━━━━━━━━━━━━━━━━━━━━
Purpose: Offline-first livestock management for Nigerian farmers
Species: Poultry (broilers, layers) + Aquaculture (catfish, tilapia)
Tech: TanStack Start + Kysely + Neon + Cloudflare Workers
Status: [new/existing/returning] (from Step 0)
```

### 🗄️ Database State

**If MCP available:**

```
Tables: [count]
Users: [count]
Farms: [count]
Active Batches: [count]
Total Revenue: ₦[amount]
```

**If MCP unavailable:**

```
⚠️ Database exploration skipped (MCP not available)
Database schema: See app/lib/db/types.ts
```

**If database empty:**

```
ℹ️ Database is empty
Suggestion: Run `bun run db:seed` or `bun run db:seed:dev`
```

### 🔧 Development State

**If git available:**

```
Branch: [current branch]
Recent: [last 3 commits]
Status: [clean/uncommitted changes]
```

**If not a git repository:**

```
⚠️ Not a git repository
Suggestion: Run `git init` to enable version control
```

### 🎯 Recommended Next Steps

**Based on context (from Step 0):**

**If `new`:**

1. Review critical patterns (especially dynamic imports!)
2. Explore the codebase: `tree -L 2 app/`
3. Start with a simple feature: `@plan-feature`
4. Or analyze existing data: `@batch-analysis`

**If `existing`:**

1. Continue your current work
2. Review uncommitted changes if any
3. Run tests: `bun run test`
4. Or plan next feature: `@plan-feature`

**If `returning`:**

1. Review recent commits to catch up
2. Check for any breaking changes in DEVLOG.md
3. Run `bun install` (dependencies may have updated)
4. Run `bun run check` to verify everything works

### ⚠️ Issues Detected

**List any issues found:**

- ❌ Missing .env → Run `@quickstart`
- ⚠️ MCP not available → Check `.kiro/settings/mcp.json`
- ⚠️ Not a git repo → Run `git init`
- ⚠️ Uncommitted changes → Commit or stash before switching tasks
- ℹ️ Empty database → Run seeding if needed

### 🚀 Quick Commands

```bash
# Start development
bun dev

# Run tests
bun test

# Check code quality
bun run lint && bun run check

# Deploy
bun run deploy
```

---

## Instructions for Assistant

### Workflow

1. **Check context** (Step 0) - Ask if new/existing/returning
2. **Validate setup** (Step 1) - Check critical files exist
3. **Read documentation** - README, AGENTS, DEVLOG
4. **Explore database** - Use MCP with error handling
5. **Check git status** - With error handling for non-git repos
6. **Summarize findings** - Provide actionable context
7. **Suggest next steps** - Based on user's context (new/existing/returning)

### Error Handling

**Always handle gracefully:**

- Missing files → Guide to quickstart or explain impact
- MCP unavailable → Continue without database exploration
- Not a git repo → Suggest initialization but continue
- Empty database → Suggest seeding
- Database errors → Show error, suggest fixes

**Never fail completely** - Always provide useful context even if some steps fail.

### Key Principles

- **Ask context first** - Tailor the priming to user's situation
- **Validate before proceeding** - Check critical files exist
- **Use MCP with fallbacks** - Don't fail if MCP unavailable
- **Be comprehensive** but concise
- **Highlight critical patterns** (dynamic imports!)
- **Provide actionable suggestions** based on detected issues
- **Reference available agents and prompts** for follow-up tasks

### Context-Aware Recommendations

**For `new` users:**

- Focus on architecture and patterns
- Emphasize critical patterns (dynamic imports)
- Suggest starting with simple features
- Point to key documentation

**For `existing` users:**

- Quick status check
- Highlight uncommitted work
- Suggest continuing current work
- Offer testing and code review

**For `returning` users:**

- Full context reload
- Review recent changes
- Check for breaking changes
- Suggest dependency updates

### After Priming

User is ready to:

- `@plan-feature` - Plan new features with full context
- `@code-review` - Review code with pattern knowledge
- `@batch-analysis` - Analyze livestock data via MCP
- `@financial-report` - Generate financial reports
- Use specialized agents for specific tasks
