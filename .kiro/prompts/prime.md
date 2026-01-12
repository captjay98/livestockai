---
description: 'Load comprehensive OpenLivestock Manager project context with MCP integration'
---

# Prime: Load OpenLivestock Manager Context

Build deep understanding of the OpenLivestock Manager codebase through documentation, database exploration, and live data analysis.

## Context

**Project**: OpenLivestock Manager - Offline-first livestock management for Nigerian poultry and aquaculture farms
**Tech Stack**: TanStack Start, Kysely ORM, Neon PostgreSQL, Cloudflare Workers, Better Auth
**Target Users**: Nigerian farmers managing poultry (broilers, layers) and aquaculture (catfish, tilapia)

## Objective

Load comprehensive project context to enable effective development, including:
- Architecture and patterns understanding
- Live database state via MCP
- Current development status
- Available agents and prompts

## Process

### Step 1: Core Documentation

**Read essential docs:**
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
export const getData = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { db } = await import('../db')  // Dynamic import!
    return db.selectFrom('table').execute()
  })

// ❌ BREAKS on Cloudflare Workers
import { db } from '../db'  // Static import fails!
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

```
# List all tables
neon_get_database_tables

# Check table schemas
neon_describe_table_schema "batches"
neon_describe_table_schema "mortality_records"
neon_describe_table_schema "sales"

# Get current data summary
neon_run_sql "SELECT COUNT(*) as count, status FROM batches GROUP BY status"
neon_run_sql "SELECT COUNT(*) as total_users FROM users"
neon_run_sql "SELECT SUM(totalAmount) as total_revenue FROM sales"
```

**Key Tables:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `farms` | Farm entities | id, name, ownerId |
| `batches` | Livestock batches | farmId, species, status, currentQuantity |
| `mortality_records` | Death tracking | batchId, quantity, cause |
| `feed_records` | Feed consumption | batchId, feedType, quantityKg, costNgn |
| `weight_samples` | Growth tracking | batchId, avgWeightKg, sampleDate |
| `sales` | Revenue | batchId, quantity, totalAmount, customerId |
| `expenses` | Costs | farmId, category, amount |
| `users` | Accounts | email, name, role |
| `customers` | Buyers | name, type, contactInfo |
| `suppliers` | Vendors | name, type, contactInfo |

### Step 5: Current Development State

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
```

### 🗄️ Database State (from MCP)

```
Tables: [count]
Users: [count]
Farms: [count]
Active Batches: [count]
Total Revenue: ₦[amount]
```

### 🔧 Development State

```
Branch: [current branch]
Recent: [last 3 commits]
Status: [clean/uncommitted changes]
```

### 🎯 Recommended Next Steps

Based on current state, suggest:
1. **If new to project**: Start with `@quickstart`
2. **If planning feature**: Use `@plan-feature [feature-name]`
3. **If reviewing code**: Use `@code-review`
4. **If analyzing data**: Use `@batch-analysis` or `@financial-report`

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
1. **Read documentation** - README, AGENTS, DEVLOG
2. **Explore database** - Use MCP to understand current data
3. **Check git status** - Understand development state
4. **Summarize findings** - Provide actionable context
5. **Suggest next steps** - Based on what user might want to do

### Key Principles
- **Use MCP** to get live database information
- **Be comprehensive** but concise
- **Highlight critical patterns** (dynamic imports!)
- **Provide actionable suggestions** for next steps
- **Reference available agents and prompts** for follow-up tasks

### After Priming

User is ready to:
- `@plan-feature` - Plan new features with full context
- `@code-review` - Review code with pattern knowledge
- `@batch-analysis` - Analyze livestock data via MCP
- `@financial-report` - Generate financial reports
- Use specialized agents for specific tasks
